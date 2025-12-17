import { type Construct } from 'constructs';
import { BaseStack } from '../../common/base-stack';
import { type StackProps } from 'aws-cdk-lib';
import { type NHCEnvVariables } from '../settings';
import { ResourceNamingService } from '../../common/resource-naming-service';
import {
  CfnDeliverySource,
  CfnDeliveryDestination,
  CfnDelivery,
  RetentionDays,
  LogGroup
} from 'aws-cdk-lib/aws-logs';
import { Key } from 'aws-cdk-lib/aws-kms';

interface NhcUiLoggingStackProps extends StackProps {
  envVariables: NHCEnvVariables;
  cloudfrontArn: string;
}

export class NhcUiLoggingStack extends BaseStack {
  public readonly deliverySource: CfnDeliverySource;
  public readonly deliveryDestination: CfnDeliveryDestination;
  public readonly delivery: CfnDelivery;
  public readonly logGroup: LogGroup;
  private readonly namingService: ResourceNamingService;
  constructor(scope: Construct, id: string, props: NhcUiLoggingStackProps) {
    super(
      scope,
      id,
      props.envVariables.common.envName,
      props.envVariables.nhcVersion,
      'us-east-1',
      true
    );

    this.namingService = new ResourceNamingService(
      props.envVariables.common.envName
    );

    const kmsKeyAlias = `alias/${props.envVariables.envType}_data_encryption`;

    const kmsKey = Key.fromKeyArn(
      this,
      'CloudfrontLoggingKmsKey',
      `arn:aws:kms:${this.region}:${props.envVariables.aws.managementAccountId}:${kmsKeyAlias}`
    );

    this.logGroup = new LogGroup(this, 'ui-cloudfront-logs', {
      logGroupName:
        this.namingService.getEnvSpecificResourceName('cloudfront-logs'),
      removalPolicy: props.envVariables.aws.removalPolicy,
      retention: props.envVariables.logRetention ?? RetentionDays.ONE_WEEK,
      encryptionKey: kmsKey
    });

    this.deliverySource = new CfnDeliverySource(
      this,
      'ui-cloudfront-delivery-source',
      {
        name: this.namingService.getEnvSpecificResourceName(
          'cloudfront-logs-source'
        ),
        logType: 'ACCESS_LOGS',
        resourceArn: props.cloudfrontArn
      }
    );

    this.deliveryDestination = new CfnDeliveryDestination(
      this,
      'ui-cloudfront-delivery-destination',
      {
        name: this.namingService.getEnvSpecificResourceName(
          'cloudfront-logs-destination'
        ),
        outputFormat: 'json',
        destinationResourceArn: this.logGroup.logGroupArn
      }
    );

    this.delivery = new CfnDelivery(this, 'ui-cloudfront-delivery', {
      deliverySourceName: this.deliverySource.name,
      deliveryDestinationArn: this.deliveryDestination.attrArn
    });

    this.delivery.node.addDependency(this.deliverySource);
    this.delivery.node.addDependency(this.deliveryDestination);
  }
}
