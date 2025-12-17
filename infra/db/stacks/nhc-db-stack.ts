import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
  TableEncryption,
  type TableProps
} from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';
import { type Construct } from 'constructs';
import { BaseStack, addEnvPrefixToPhysicalId } from '../../common/base-stack';
import { type NHCEnvVariables } from '../settings';
import { Tags } from 'aws-cdk-lib';
import { BackupTags, EnvType } from '../../common/lib/enums';
import { type IKey } from 'aws-cdk-lib/aws-kms';

interface NhcDbStackProps extends cdk.StackProps {
  envVariables: NHCEnvVariables;
}

export class NhcDbStack extends BaseStack {
  readonly kmsKey: IKey;
  public readonly patientTable: Table;
  public readonly healthCheckTable: Table;
  public readonly orderTable: Table;
  public readonly labResultTable: Table;
  public readonly auditEventTable: Table;
  public readonly gpOdsCodeTable: Table;
  public readonly sessionTable: Table;
  public readonly snomedTable: Table;
  public readonly gpUpdateSchedulerTable: Table;
  public readonly postcodeLsoaMappingTable: Table;
  public readonly lsoaImdMappingTable: Table;
  public readonly deadLetterMessagesTable: Table;
  public readonly communicationLogTable: Table;
  public readonly mnsMessagesLogTable: Table;

  constructor(scope: Construct, id: string, props: NhcDbStackProps) {
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

    this.patientTable = this.createDynamoDbTable(
      this,
      'nhc-patient-db',
      props.envVariables.envType,
      {
        partitionKey: {
          name: 'nhsNumber',
          type: AttributeType.STRING
        }
      },
      props.envVariables.aws.removalPolicy,
      this.kmsKey,
      props.envVariables.pointInTimeRecoveryEnabled,
      props.envVariables.tableDeletionProtectionEnabled
    );

    this.orderTable = this.createDynamoDbTable(
      this,
      'nhc-order-db',
      props.envVariables.envType,
      {
        partitionKey: {
          name: 'id',
          type: AttributeType.STRING
        }
      },
      props.envVariables.aws.removalPolicy,
      this.kmsKey,
      props.envVariables.pointInTimeRecoveryEnabled,
      props.envVariables.tableDeletionProtectionEnabled
    );
    this.orderTable.addGlobalSecondaryIndex({
      indexName: 'healthCheckIdIndex',
      partitionKey: {
        name: 'healthCheckId',
        type: AttributeType.STRING
      }
    });

    this.healthCheckTable = this.createDynamoDbTable(
      this,
      'nhc-health-check-db',
      props.envVariables.envType,
      {
        partitionKey: {
          name: 'id',
          type: AttributeType.STRING
        },
        stream: StreamViewType.NEW_IMAGE
      },
      props.envVariables.aws.removalPolicy,
      this.kmsKey,
      props.envVariables.pointInTimeRecoveryEnabled,
      props.envVariables.tableDeletionProtectionEnabled
    );
    this.healthCheckTable.addGlobalSecondaryIndex({
      indexName: 'nhsNumberIndex',
      partitionKey: {
        name: 'nhsNumber',
        type: AttributeType.STRING
      }
    });
    this.healthCheckTable.addGlobalSecondaryIndex({
      indexName: 'stepIndex',
      partitionKey: {
        name: 'step',
        type: AttributeType.STRING
      }
    });
    this.healthCheckTable.addGlobalSecondaryIndex({
      indexName: 'bloodTestExpiryWritebackStatusStepIndex',
      partitionKey: {
        name: 'bloodTestExpiryWritebackStatus',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'step',
        type: AttributeType.STRING
      }
    });
    this.healthCheckTable.addGlobalSecondaryIndex({
      indexName: 'expiryStatusStepIndex',
      partitionKey: {
        name: 'expiryStatus',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'step',
        type: AttributeType.STRING
      }
    });

    this.labResultTable = this.createDynamoDbTable(
      this,
      'nhc-lab-result-db',
      props.envVariables.envType,
      {
        partitionKey: {
          name: 'orderId',
          type: AttributeType.STRING
        },
        sortKey: {
          name: 'testType',
          type: AttributeType.STRING
        }
      },
      props.envVariables.aws.removalPolicy,
      this.kmsKey,
      props.envVariables.pointInTimeRecoveryEnabled,
      props.envVariables.tableDeletionProtectionEnabled
    );
    this.labResultTable.addGlobalSecondaryIndex({
      indexName: 'healthCheckIdIndex',
      partitionKey: {
        name: 'healthCheckId',
        type: AttributeType.STRING
      }
    });
    this.labResultTable.addGlobalSecondaryIndex({
      indexName: 'patientIdIndex',
      partitionKey: {
        name: 'patientId',
        type: AttributeType.STRING
      }
    });

    this.auditEventTable = this.createDynamoDbTable(
      this,
      'nhc-audit-event-db',
      props.envVariables.envType,
      {
        partitionKey: {
          name: 'id',
          type: AttributeType.STRING
        },
        stream: StreamViewType.NEW_IMAGE
      },
      props.envVariables.aws.removalPolicy,
      this.kmsKey,
      props.envVariables.pointInTimeRecoveryEnabled,
      props.envVariables.tableDeletionProtectionEnabled
    );

    this.auditEventTable.addGlobalSecondaryIndex({
      indexName: 'nhsNumberIndex',
      partitionKey: {
        name: 'nhsNumber',
        type: AttributeType.STRING
      }
    });

    this.gpOdsCodeTable = this.createDynamoDbTable(
      this,
      'nhc-ods-code-db',
      props.envVariables.envType,
      {
        partitionKey: {
          name: 'gpOdsCode',
          type: AttributeType.STRING
        },
        stream: StreamViewType.NEW_IMAGE
      },
      props.envVariables.aws.removalPolicy,
      this.kmsKey,
      props.envVariables.pointInTimeRecoveryEnabled,
      props.envVariables.tableDeletionProtectionEnabled
    );

    this.sessionTable = this.createDynamoDbTable(
      this,
      'nhc-session-db',
      props.envVariables.envType,
      {
        partitionKey: {
          name: 'sessionId',
          type: AttributeType.STRING
        },
        timeToLiveAttribute: 'ttl'
      },
      props.envVariables.aws.removalPolicy,
      this.kmsKey,
      props.envVariables.pointInTimeRecoveryEnabled,
      props.envVariables.tableDeletionProtectionEnabled
    );

    this.snomedTable = this.createDynamoDbTable(
      this,
      'nhc-snomed-db',
      props.envVariables.envType,
      {
        partitionKey: {
          name: 'id',
          type: AttributeType.STRING
        }
      },
      props.envVariables.aws.removalPolicy,
      this.kmsKey,
      props.envVariables.pointInTimeRecoveryEnabled,
      props.envVariables.tableDeletionProtectionEnabled
    );

    this.gpUpdateSchedulerTable = this.createDynamoDbTable(
      this,
      'nhc-gp-update-scheduler-db',
      props.envVariables.envType,
      {
        partitionKey: {
          name: 'scheduleId',
          type: AttributeType.STRING
        }
      },
      props.envVariables.aws.removalPolicy,
      this.kmsKey,
      props.envVariables.pointInTimeRecoveryEnabled,
      props.envVariables.tableDeletionProtectionEnabled
    );
    this.gpUpdateSchedulerTable.addGlobalSecondaryIndex({
      indexName: 'healthCheckIdIndex',
      partitionKey: {
        name: 'healthCheckId',
        type: AttributeType.STRING
      }
    });

    this.deadLetterMessagesTable = this.createDynamoDbTable(
      this,
      'nhc-dead-letter-messages-db',
      props.envVariables.envType,
      {
        partitionKey: {
          name: 'id',
          type: AttributeType.STRING
        },
        timeToLiveAttribute: 'deleteTime'
      },
      props.envVariables.aws.removalPolicy,
      this.kmsKey,
      props.envVariables.pointInTimeRecoveryEnabled,
      props.envVariables.tableDeletionProtectionEnabled
    );
    this.deadLetterMessagesTable.addGlobalSecondaryIndex({
      indexName: 'queueNameIndex',
      partitionKey: {
        name: 'queueName',
        type: AttributeType.STRING
      }
    });

    this.postcodeLsoaMappingTable = this.createDynamoDbTable(
      this,
      'nhc-postcode-lsoa-db',
      props.envVariables.envType,
      {
        partitionKey: {
          name: 'postcode',
          type: AttributeType.STRING
        }
      },
      props.envVariables.aws.removalPolicy,
      this.kmsKey,
      props.envVariables.pointInTimeRecoveryEnabled,
      props.envVariables.tableDeletionProtectionEnabled
    );

    this.lsoaImdMappingTable = this.createDynamoDbTable(
      this,
      'nhc-lsoa-imd-db',
      props.envVariables.envType,
      {
        partitionKey: {
          name: 'lsoaCode',
          type: AttributeType.STRING
        }
      },
      props.envVariables.aws.removalPolicy,
      this.kmsKey,
      props.envVariables.pointInTimeRecoveryEnabled,
      props.envVariables.tableDeletionProtectionEnabled
    );

    this.communicationLogTable = this.createDynamoDbTable(
      this,
      'nhc-communication-log-db',
      props.envVariables.envType,
      {
        partitionKey: {
          name: 'messageReference',
          type: AttributeType.STRING
        },
        timeToLiveAttribute: 'ttl'
      },
      props.envVariables.aws.removalPolicy,
      this.kmsKey,
      props.envVariables.pointInTimeRecoveryEnabled,
      props.envVariables.tableDeletionProtectionEnabled
    );

    this.mnsMessagesLogTable = this.createDynamoDbTable(
      this,
      'nhc-mns-messages-log-db',
      props.envVariables.envType,
      {
        partitionKey: {
          name: 'id',
          type: AttributeType.STRING
        }
      },
      props.envVariables.aws.removalPolicy,
      this.kmsKey,
      props.envVariables.pointInTimeRecoveryEnabled,
      props.envVariables.tableDeletionProtectionEnabled
    );

    new cdk.CfnOutput(this, `${this.envName}AuditEventTableStreamArn`, {
      value: this.auditEventTable.tableStreamArn ?? '',
      exportName: `${this.envName}AuditEventTableStreamArn`
    });

    new cdk.CfnOutput(this, `${this.envName}HealthChecksTableStreamArn`, {
      value: this.healthCheckTable.tableStreamArn ?? '',
      exportName: `${this.envName}HealthChecksTableStreamArn`
    });

    new cdk.CfnOutput(this, `${this.envName}OdsCodeTableStreamArn`, {
      value: this.gpOdsCodeTable.tableStreamArn ?? '',
      exportName: `${this.envName}OdsCodeTableStreamArn`
    });
  }

  // eslint-disable-next-line max-params
  createDynamoDbTable(
    scope: Construct,
    tableName: string,
    envType: string,
    props: TableProps,
    awsResourcesRemovalPolicy: cdk.RemovalPolicy,
    kmsKey: IKey,
    pointInTimeRecoveryEnabled: boolean,
    tableDeletionProtectionEnabled: boolean
  ): Table {
    const table = new Table(scope, tableName, {
      ...props,
      tableName: addEnvPrefixToPhysicalId(this.envName, tableName),
      billingMode: BillingMode.PAY_PER_REQUEST,

      /**
       * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new table, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will delete the table (even if it has data in it)
       */
      removalPolicy: awsResourcesRemovalPolicy,
      encryption: TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled
      },
      deletionProtection: tableDeletionProtectionEnabled
    });

    if (envType === EnvType.PROD) {
      Tags.of(table).add(BackupTags.HourlyBackup, 'true');
    }

    return table;
  }
}
