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
  RouterName: string;
  Router: CfnVirtualRouter;    
}

export class PhotoGalleryCdkStack extends cdk.Stack {
  readonly APP_PORT = 8080;
  readonly dispatcherImage = 'mobytoby/dispatcher:latest'
  readonly namespace = 'gallery.local';
  readonly processors = ['greyscale', 'polaroid'];
  readonly processorPrefix = 'mobytoby/';
  readonly processorSuffix = ':latest';

  logGroup: LogGroup;
  vpc: Vpc;
  internalSecurityGroup: SecurityGroup;
  externalSecurityGroup: SecurityGroup;
  cluster: Cluster;
  dispatcherTaskRole: Role;
  serviceTaskRole: Role;
  taskExecutionRole: Role;
  mesh: CfnMesh;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    this.createLogGroup();
    this.createVpc();
    this.createCluster();
    this.createDispatcher();
    this.createServices(...this.processors);
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
      parameterName: '/pg-cdk/settings/securityGroups',
      description: 'The security groups to configure running tasks with'
    });

    new StringListParameter(this, 'subnets', {
      stringListValue: this.vpc.privateSubnets.map(sn => sn.subnetId),
      parameterName: '/pg-cdk/settings/subnets',
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
    this.serviceTaskRole = new Role(this, 'pg-service-task-role', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSAppMeshEnvoyAccess'),
      ],
    });

    this.dispatcherTaskRole = new Role(this, 'pg-dispatcher-task-role', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AWSAppMeshEnvoyAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        
      ],
    });

    // grant ECR pull permission to IAM task execution role for ECS agent
    this.taskExecutionRole = new Role(this, 'pg-task-execution-role', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        // ManagedPolicy.fromAwsManagedPolicyName('AmazonECSTaskExecutionRolePolicy'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
      ],
    });

    new StringParameter(this, 'cluster', {
      stringValue: this.cluster.clusterArn,
      parameterName: '/pg-cdk/settings/cluster',
      description: 'The cluster into which to launch new tasks',
    });

    // CDK will print after finished deploying stack
    new cdk.CfnOutput(this, 'ClusterName', {
      description: 'ECS/Fargate cluster name',
      value: this.cluster.clusterName,
    });
  }

  createDispatcher() {
    const dispatcherTaskDef = new FargateTaskDefinition(this, 'pg-dispatcher', {
      family: 'pg-dispatcher',
      taskRole: this.dispatcherTaskRole,
      executionRole: this.taskExecutionRole,
      cpu: 256,
      memoryLimitMiB: 512,
    });

    new StringParameter(this, 'task-definition', {
      stringValue: dispatcherTaskDef.taskDefinitionArn,
      parameterName: '/pg-cdk/settings/taskDefinition',
      description: 'The arn of the dispatcher task which handles orchestrating image processing'
    });
  
    const environment: {[index:string]: string} = {
      'ASPNETCORE_URLS': `http://+:${this.APP_PORT}`,
      'PHOTOGALLERY_Processing__Port': `${this.APP_PORT}`
    };

    const dispatcherContainer = dispatcherTaskDef.addContainer('dispatcher', {
      image: ContainerImage.fromRegistry(this.dispatcherImage),
      environment: environment,
      logging: LogDriver.awsLogs({
        logGroup: this.logGroup,
        streamPrefix: 'dispatcher',
      }),
    });
    dispatcherContainer.addPortMappings({
      containerPort: this.APP_PORT,
    });

    this.addXrayContainer(dispatcherTaskDef);
    new FargateService(this, 'dispatcher', {
      cluster: this.cluster,
      serviceName: 'dispatcher',
      taskDefinition: dispatcherTaskDef,
      desiredCount: 1,
      securityGroup: this.internalSecurityGroup,
      cloudMapOptions: {
        name: 'dispatcher',
      }
    });

    new cdk.CfnOutput(this, "Dispatcher Task ARN:", {
      description: "Dispatcher Task Definition ARN",
      value: dispatcherTaskDef.taskDefinitionArn,
    })
  }

  createServices(...processors: string[]) {
    const create = (processor: string, serviceName: string) => {
      const taskDef = new FargateTaskDefinition(this, `${processor}-taskdef`, {
        family: `pg-${processor}`,
        executionRole: this.taskExecutionRole,
        taskRole: this.serviceTaskRole,
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
          streamPrefix: `${processor}`,
        }),
      });
      container.addPortMappings({
        containerPort: this.APP_PORT,
      });
      this.addXrayContainer(taskDef);

      new FargateService(this, `${processor}`, {
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
    create(processors[0], 'enhance');
    processors.slice(1).forEach(processor => {
      create(processor, `enhance-${processor}`);
    });
  }

  createMesh() {
    this.mesh = new CfnMesh(this, "Mesh", {
      meshName: this.stackName,
    });

    this.createVirtualNodes();
    let routers = this.createVirtualRouter();
    this.createDispatchRoute(routers.find(r => r.RouterName === 'dispatcher'));
    this.createServiceRoutes(routers.find(r => r.RouterName === 'enhance'));
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
                  value: `pg-${name}`,
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

    // creates: dispatcher-vn => dispatcher.mesh.local
    // Also creates its "Backends" dependencies
    // From the docs: 
    create("dispatcher", 
           this.namespace, 
           "dispatcher", 
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
    const create = (routerName: string): CfnVirtualRouter => {
      const router = new CfnVirtualRouter(this, `${routerName}-virtual-router`, {
        virtualRouterName: `${routerName}-vr`,
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
    const routerNames = ['dispatcher', 'enhance'];
    return routerNames.map((p) => { return { RouterName: p, Router: create(p) }});
  }

  createDispatchRoute(map: VirtualRouterMap | undefined) { 
    if (!map || map === undefined) return;
    const route = new CfnRoute(this, `${map.RouterName}-route`, {
      routeName: `${map.RouterName}-route`,
      meshName: this.mesh.meshName,
      virtualRouterName: map.Router.virtualRouterName,
      spec: {
        httpRoute: {
          match: {
            prefix: "/",
          },
          action: {
            weightedTargets: [{
              virtualNode: `${map.RouterName}-vn`,
              weight: 1,
            }],
          },
        },
      },
    });
    route.addDependsOn(map.Router);    
  }

  createServiceRoutes(map: VirtualRouterMap | undefined) { 
    if (!map || map === undefined) return;
    const route = new CfnRoute(this, `${map.RouterName}-route`, {
      routeName: `${map.RouterName}-route`,
      meshName: this.mesh.meshName,
      virtualRouterName: map.Router.virtualRouterName,
      spec: {
        httpRoute: {
          match: {
            prefix: "/",
          },
          action: {
            weightedTargets: this.processors.map(p => {
              return { 
                virtualNode: `${p}-vn`,
                weight: 1
              }
            })
          },
        },
      },
    });
    route.addDependsOn(map.Router);    
  }

  createVirtualService(routers: VirtualRouterMap[]) {
    routers.forEach(map => {
      let svc = new CfnVirtualService(this, `${map.RouterName}-virtual-service`, {
        virtualServiceName: `${map.RouterName}.${this.namespace}`,
        meshName: this.mesh.meshName,
        spec: {
          provider: {
            virtualRouter: {virtualRouterName: `${map.RouterName}-vr`},
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
