import { Port, SecurityGroup, SubnetType, Vpc } from '@aws-cdk/aws-ec2';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import * as cdk from '@aws-cdk/core';

export class CdkStack extends cdk.Stack {
  readonly APP_PORT = 8080;

  externalSecurityGroup: SecurityGroup;
  internalSecurityGroup: SecurityGroup;
  logGroup: LogGroup;
  vpc: Vpc;


  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    this.createLogGroup();
    this.createVpc()
  }

  createLogGroup() {
    this.logGroup = new LogGroup(this, "LogGroup", {
      logGroupName: this.stackName,
      retention: RetentionDays.ONE_DAY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }


  createVpc() {
    // The VPC will have 2 AZs, 2 NAT gateways, and an internet gateway
    this.vpc = new Vpc(this, "VPC", {
      cidr: "10.0.0.0/16",
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "ingress",
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "application",
          subnetType: SubnetType.PRIVATE,
        },
      ],
    });

    // Allow public inbound web traffic on port 80
    this.externalSecurityGroup = new SecurityGroup(this, "ExternalSG", {
      vpc: this.vpc,
      allowAllOutbound: true,
    });
    this.externalSecurityGroup.connections.allowFromAnyIpv4(Port.tcp(80));

    // Allow communication within the vpc for the app and envoy containers
    // inbound 8080, 9901, 15000; all outbound
    // - 8080: default app port for gateway and colorteller
    // - 9901: envoy admin interface, used for health check
    // - 15000: envoy ingress ports (egress over 15001 will be allowed by allowAllOutbound)
    this.internalSecurityGroup = new SecurityGroup(this, "InternalSG", {
      vpc: this.vpc,
      allowAllOutbound: true,
    });
    [Port.tcp(this.APP_PORT), Port.tcp(9901), Port.tcp(15000)].forEach(port => {
      this.internalSecurityGroup.connections.allowInternally(port);
    });
  }

}
