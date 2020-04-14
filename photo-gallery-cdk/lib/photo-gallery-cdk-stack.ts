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
import { Repository } from '@aws-cdk/aws-ecr';
import { StringParameter, StringListParameter } from '@aws-cdk/aws-ssm';

interface VirtualRouterMap {
  Processor: string;
  Router: CfnVirtualRouter;    
}

export class PhotoGalleryCdkStack extends cdk.Stack {
  readonly APP_PORT = 8080;
  readonly schedulerImage = 'mobytoby/job-scheduler:latest'
  readonly namespace = 'gallery.local';
  readonly processors = ['greyscale'];
  readonly processorPrefix = 'mobytoby/';
  readonly processorSuffix = ':latest';

  logGroup: LogGroup;
  vpc: Vpc;
  internalSecurityGroup: SecurityGroup;
  externalSecurityGroup: SecurityGroup;
  cluster: Cluster;
  schedulerTaskRole: Role;
  taskExecutionRole: Role;
  mesh: CfnMesh;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    this.createLogGroup();
    this.createVpc();
    this.createCluster();
    this.createJobScheduler();
    this.createProcessors(...this.processors);
    this.createMesh();
  }

  createLogGroup() {
    this.logGroup = new LogGroup(this, 'pg-log-group', {
      logGroupName: this.stackName,
      retention: RetentionDays.ONE_DAY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
    
    new StringListParameter(this, 'security-groups', {
      stringListValue: [this.internalSecurityGroup.securityGroupId],
      parameterName: '/pg-cdk/securityGroups',
      description: 'The security groups to configure running tasks with'
    });

    new StringListParameter(this, 'subnets', {
      stringListValue: this.vpc.privateSubnets.map(sn => sn.subnetId),
      parameterName: '/pg-cdk/subnets',
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
        // ManagedPolicy.fromAwsManagedPolicyName('AmazonECSTaskExecutionRolePolicy'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
      ],
    });

    new StringParameter(this, 'cluster', {
      stringValue: this.cluster.clusterArn,
      parameterName: '/pg-cdk/cluster',
      description: 'The cluster into which to launch new tasks',
    });

    // CDK will print after finished deploying stack
    new cdk.CfnOutput(this, 'ClusterName', {
      description: 'ECS/Fargate cluster name',
      value: this.cluster.clusterName,
    });
  }

  createJobScheduler() {
    const schedulerTaskDef = new FargateTaskDefinition(this, 'pg-job-scheduler', {
      family: 'pg-job-scheduler',
      taskRole: this.schedulerTaskRole,
      executionRole: this.taskExecutionRole,
      cpu: 256,
      memoryLimitMiB: 512,
    });

    new StringParameter(this, 'task-definition', {
      stringValue: schedulerTaskDef.taskDefinitionArn,
      parameterName: '/pg-cdk/taskDefinition',
      description: 'The arn of the scheduler task which handles orchestrating image processing'
    });
  
    const environment: {[index:string]: string} = {};
    this.processors.map(p => {
      environment[`PHOTOGALLERY_Processing__${p}__BaseUri`] = `http://${p}.${this.namespace}:${this.APP_PORT}`
    });

    const schdulerContainer = schedulerTaskDef.addContainer('job-scheduler', {
      image: ContainerImage.fromRegistry(this.schedulerImage),
      environment: environment,
      logging: LogDriver.awsLogs({
        logGroup: this.logGroup,
        streamPrefix: 'scheduler',
      }),
    });
    schdulerContainer.addPortMappings({
      containerPort: this.APP_PORT,
    });

    this.addXrayContainer(schedulerTaskDef);

    new cdk.CfnOutput(this, "Scheduler Task ARN:", {
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
        image: ContainerImage.fromRegistry(`${this.processorPrefix}${processor}${this.processorSuffix}`),
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
    const create = (name: string, namespace: string, serviceName?: string, backends?: CfnVirtualNode.BackendProperty[]) => {
      serviceName = serviceName || name;

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
      const router = new CfnVirtualRouter(this, `${processor}-virtual-router`, {
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
      const route = new CfnRoute(this, `${map.Processor}-route`, {
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
