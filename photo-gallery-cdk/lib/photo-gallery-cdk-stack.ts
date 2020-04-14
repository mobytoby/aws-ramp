import * as cdk from '@aws-cdk/core';
import {
  CfnMesh,
  CfnRoute,
  CfnVirtualNode,
  CfnVirtualRouter,
  CfnVirtualService,
} from '@aws-cdk/aws-appmesh';
import { Port, SecurityGroup, SubnetType, Vpc } from '@aws-cdk/aws-ec2';
import {
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDriver,
  Protocol,
  TaskDefinition,
} from '@aws-cdk/aws-ecs';
import { ManagedPolicy, Role, ServicePrincipal, Policy } from '@aws-cdk/aws-iam';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import { RemovalPolicy, CfnOutput } from '@aws-cdk/core';
import { Repository } from '@aws-cdk/aws-ecr';
import { StringParameter, StringListParameter } from '@aws-cdk/aws-ssm';

interface VirtualRouterMap {
  Processor: string;
  Router: CfnVirtualRouter;    
}

export class PhotoGalleryCdkStack extends cdk.Stack {
  readonly APP_PORT = 8080;
  readonly namespace = 'gallery.local';
  
  readonly processors = ['greyscale'];
  
  // TODO this may go away once we get the ECR up within the CDK env
  readonly SchedulerImage = 'mobytoby/job-scheduler:latest'
  readonly ProcessorPrefix = 'mobytoby/';
  readonly ProcessorSuffix = ':latest';

  stackName: string;
  schedulerRepo: Repository;
  schedulerTaskRole: Role;
  taskExecutionRole: Role;
  vpc: Vpc;
  cluster: Cluster;
  internalSecurityGroup: SecurityGroup;
  externalSecurityGroup: SecurityGroup;
  logGroup: LogGroup;
  mesh: CfnMesh;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.stackName = "photo-gallery";

    // this.createLogGroup();
    // this.createVpc();
    // this.createCluster();
    // this.createJobScheduler();
    // this.createProcessors(...this.processors);
    // this.createMesh();
  }

  // TODO This isn't called. Figure out a way to bash-script the creation, tag and push of 
  // the scheduler image prior to, or in concert with, the running of the cdk deploy
  createEcrRepos() {
    this.schedulerRepo = new Repository(this, 'pg-job-scheduler', {
      repositoryName: 'pg-job-scheduler',
    });
  }

  createLogGroup() {
    this.logGroup = new LogGroup(this, 'pg-log-group', {
      logGroupName: this.stackName,
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }

  createVpc() {
    // The VPC will have 2 AZs, 2 NAT gateways, and an internet gateway
    this.vpc = new Vpc(this, 'pg-vpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'ingress',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'application',
          subnetType: SubnetType.PRIVATE,
        },
      ],
    });

    // Allow public inbound web traffic on port 80
    this.externalSecurityGroup = new SecurityGroup(this, 'pg-external-sg', {
      vpc: this.vpc,
      allowAllOutbound: true,
    });
    this.externalSecurityGroup.connections.allowFromAnyIpv4(Port.tcp(80));

    // Allow communication within the vpc for the app and envoy containers
    // inbound 8080, 9901, 15000; all outbound
    // - 8080: default app port for gateway and colorteller
    // - 9901: envoy admin interface, used for health check
    // - 15000: envoy ingress ports (egress over 15001 will be allowed by allowAllOutbound)
    this.internalSecurityGroup = new SecurityGroup(this, 'pg-internal-sg', {
      vpc: this.vpc,
      allowAllOutbound: true,
    });
    [Port.tcp(this.APP_PORT), Port.tcp(9901), Port.tcp(15000)].forEach((port) => {
      this.internalSecurityGroup.connections.allowInternally(port);
    });
    
    new StringListParameter(this, 'pg-cdk/securityGroups', {
      stringListValue: [this.internalSecurityGroup.securityGroupId],
      parameterName: 'pg-cdk/securityGroups',
      description: 'The security groups to configure running tasks with'
    });

    new StringListParameter(this, 'pg-cdk/subnets', {
      stringListValue: this.vpc.privateSubnets.map(sn => sn.subnetId),
      parameterName: 'pg-cdk/subnets',
      description: 'The subnets to configure running tasks with'
    });
  }

  createCluster() {
    // Deploy a Fargate cluster on ECS
    this.cluster = new Cluster(this, 'pg-cluster', {
      vpc: this.vpc,
    });

    // Use Cloud Map for service discovery within the cluster, which
    // relies on either ECS Service Discovery or App Mesh integration
    // (default: cloudmap.NamespaceType.DNS_PRIVATE)
    this.cluster.addDefaultCloudMapNamespace({
      name: this.namespace,
    });


    // grant cloudwatch and xray permissions to IAM task role for color app tasks
    this.schedulerTaskRole = new Role(this, 'TaskRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSAppMeshEnvoyAccess'),
        // TODO This should be restricted to read/write only on the photo-storage bucket
        ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
      ],
    });

    // grant ECR pull permission to IAM task execution role for ECS agent
    this.taskExecutionRole = new Role(this, 'TaskExecutionRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonECSTaskExecutionRolePolicy'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
      ],
    });

    new StringParameter(this, 'pg-cdk/cluster', {
      stringValue: this.cluster.clusterArn,
      parameterName: 'pg-cdk/cluster',
      description: 'The cluster into which to launch new tasks',
    });

    // CDK will print after finished deploying stack
    new CfnOutput(this, 'ClusterName', {
      description: 'ECS/Fargate cluster name',
      value: this.cluster.clusterName,
    });
  }

  createJobScheduler() {
    const schedulerTaskDef = new FargateTaskDefinition(this, 'pg-job-scheduler', {
      family: 'job-scheduler',
      taskRole: this.schedulerTaskRole,
      executionRole: this.taskExecutionRole,
      cpu: 256,
      memoryLimitMiB: 512,
    });

    new StringParameter(this, 'pg-cdk/taskDefinition', {
      stringValue: schedulerTaskDef.taskDefinitionArn,
      parameterName: 'pg-cdk/taskDefinition',
      description: 'The arn of the scheduler task which handles orchestrating image processing'
    });

    const schdulerContainer = schedulerTaskDef.addContainer('job-scheduler', {
      image: ContainerImage.fromRegistry(this.SchedulerImage),
      environment: {
        SERVER_PORT: `${this.APP_PORT}`,
        PHOTOGALLERY_Processing__Greyscale__BaseUri: `greyscale.${this.namespace}:${this.APP_PORT}`,
        PHOTOGALLERY_Processing__Greyscale__Path: 'greyscale',
      },
      logging: LogDriver.awsLogs({
        logGroup: this.logGroup,
        streamPrefix: 'scheduler',
      }),
    });
    schdulerContainer.addPortMappings({
      containerPort: this.APP_PORT,
    });

    this.addXrayContainer(schedulerTaskDef);

    new CfnOutput(this, "Scheduler Task ARN:", {
      description: "Scheduler Task Definition ARN (for use in parameter store)",
      value: schedulerTaskDef.taskDefinitionArn,
    })
  }

  createProcessors(...processors: string[]) {
    const create = (processor: string, serviceName: string) => {
      const taskDef = new FargateTaskDefinition(this, `${processor}-taskdef`, {
        family: processor,
        executionRole: this.taskExecutionRole,
        cpu: 256,
        memoryLimitMiB:512
      });

      const container = taskDef.addContainer('app', {
        image: ContainerImage.fromRegistry(`${this.ProcessorPrefix}${processor}${this.ProcessorSuffix}`),
        environment: {
          ASPNETCORE_URLS: `http://+:${this.APP_PORT}`
        },
        logging: LogDriver.awsLogs({
          logGroup: this.logGroup,
          streamPrefix: `pg-processor-${processor}`,
        }),
      });
      container.addPortMappings({
        containerPort: this.APP_PORT,
      });
      this.addXrayContainer(taskDef);

      new FargateService(this, `service-${processor}`, {
        cluster: this.cluster,
        serviceName: serviceName,
        taskDefinition: taskDef,
        desiredCount: 1,
        securityGroup: this.internalSecurityGroup,
        cloudMapOptions: {
          name: serviceName,
        }
      });
    }
    processors.forEach(p => create(p, `${p}-service`));
  }

  createMesh() {
    this.mesh = new CfnMesh(this, "Mesh", {
      meshName: this.stackName,
    });

    this.createVirtualNodes();
    let routers = this.createVirtualRouter();
    this.createRoute(routers);
    this.createVirtualService(routers);
  }

  createVirtualNodes() {
    // name is the task *family* name (eg: "blue")
    // namespace is the CloudMap namespace (eg, "mesh.local")
    // serviceName is the discovery name (eg: "colorteller")
    // CloudMap allows discovery names to be overloaded, unfortunately CDK doesn't support yet
    const create = (name: string, namespace: string, serviceName?: string, backends?: CfnVirtualNode.BackendProperty[]) => {
      serviceName = serviceName || name;

      // WARNING: keep name in sync with the route spec, if using this node in a route
      // WARNING: keep name in sync with the virtual service, if using this node as a provider
      // update the route spec as well in createRoute()
      let nodeName = `${name}-vn`;
      (new CfnVirtualNode(this, nodeName, {
        meshName: this.mesh.meshName,
        virtualNodeName: nodeName,
        spec: {
          serviceDiscovery: {
            awsCloudMap: {
              serviceName: serviceName,
              namespaceName: namespace,
              attributes: [
                {
                  key: "ECS_TASK_DEFINITION_FAMILY",
                  value: name,
                },
              ],
            },
          },
          listeners: [{
            portMapping: {
              protocol: "http",
              port: this.APP_PORT,
            },
            healthCheck: {
              healthyThreshold: 2,
              intervalMillis: 10 * 1000,
              path: "/ping",
              port: this.APP_PORT,
              protocol: "http",
              timeoutMillis: 5 * 1000,
              unhealthyThreshold: 2,
            },
          }],
          backends: backends,
        },
      })).addDependsOn(this.mesh);
    };

    // creates: job-scheduler-vn => job-scheduler.mesh.local
    // Also creates its "Backends" dependencies
    // From the docs: 
    create("job-scheduler", 
           this.namespace, 
           "job-scheduler", 
           this.processors.map(p => {
              return {
                virtualService: { 
                  virtualServiceName:`${p}.${this.namespace}`
                } 
              }
           }));
    
    //Create a new node for each processor. Processors have no backend dependency
    this.processors.forEach(p => {
      create(p, this.namespace, p);
    });
  }

  createVirtualRouter(): VirtualRouterMap[] {
    const create = (processor: string): CfnVirtualRouter => {
      let router = new CfnVirtualRouter(this, `${processor}-virtual-router`, {
        virtualRouterName: `${processor}-vr`,
        meshName: this.mesh.meshName,
        spec: {
          listeners: [{
            portMapping: {
              protocol: "http",
              port: this.APP_PORT,
            },
          }],
        },
      });
      router.addDependsOn(this.mesh);
      return router;
    }
    return this.processors.map((p) => { return { Processor: p, Router: create(p) }});
  }

  createRoute(routers: VirtualRouterMap[]) {
    routers.forEach(map => {
      let route = new CfnRoute(this, `${map.Processor}-route`, {
        routeName: `${map.Processor}-route`,
        meshName: this.mesh.meshName,
        virtualRouterName: map.Router.virtualRouterName,
        spec: {
          httpRoute: {
            match: {
              prefix: "/",
            },
            action: {
              weightedTargets: [{
                virtualNode: `${map.Processor}-vn`,
                weight: 1,
              }],
            },
          },
        },
      });
      route.addDependsOn(map.Router);
    });
  }

  createVirtualService(routers: VirtualRouterMap[]) {
    routers.forEach(map => {
      let svc = new CfnVirtualService(this, `${map.Processor}-virtual-service`, {
        virtualServiceName: `${map.Processor}.${this.namespace}`,
        meshName: this.mesh.meshName,
        spec: {
          provider: {
            virtualRouter: {virtualRouterName: `${map.Processor}-vr`},
          },
        },
      });
      svc.addDependsOn(map.Router);
    });
  }

  // Helpers

  private addXrayContainer(taskDef: TaskDefinition) {
    const xrayContainer = taskDef.addContainer("xray", {
      image: ContainerImage.fromRegistry("amazon/aws-xray-daemon"),
      user: "1337",
      memoryReservationMiB: 256,
      cpu: 32,
    });
    xrayContainer.addPortMappings({
      containerPort: 2000,
      protocol: Protocol.UDP,
    });  
  }

}
