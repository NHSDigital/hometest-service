import { type Construct } from 'constructs';
import { BaseStack, addEnvPrefixToPhysicalId } from '../../common/base-stack';
import { type RemovalPolicy, type StackProps } from 'aws-cdk-lib';
import {
  AttributeType,
  BillingMode,
  Table,
  TableEncryption,
  type TableProps
} from 'aws-cdk-lib/aws-dynamodb';
import { type NHCEnvVariables } from '../settings';
import { type IKey } from 'aws-cdk-lib/aws-kms';

interface NhcDevDbStackProps extends StackProps {
  envVariables: NHCEnvVariables;
}

export class NhcDevDbStack extends BaseStack {
  readonly kmsKey: IKey;
  public readonly townsendScoreTable: Table;

  constructor(scope: Construct, id: string, props: NhcDevDbStackProps) {
    super(
      scope,
      id,
      props.envVariables.common.envName,
      props.envVariables.nhcVersion
    );
    this.kmsKey = this.getKmsKeyById(
      props.envVariables.aws.managementAccountId,
      props.envVariables.security.kmsKeyId
    );

    this.townsendScoreTable = this.createDynamoDbTable(
      this,
      'nhc-townsend-dev-db',
      {
        partitionKey: {
          name: 'postcode',
          type: AttributeType.STRING
        }
      },
      props.envVariables.awsResourcesRemovalPolicy
    );
  }

  createDynamoDbTable(
    scope: Construct,
    tableName: string,
    props: TableProps,
    awsResourcesRemovalPolicy: RemovalPolicy
  ): Table {
    return new Table(scope, tableName, {
      ...props,
      tableName: addEnvPrefixToPhysicalId(this.envName, tableName),
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: awsResourcesRemovalPolicy,
      encryption: TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.kmsKey
    });
  }
}
