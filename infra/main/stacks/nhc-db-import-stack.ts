import { type ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { type Construct } from 'constructs';
import { Fn, type StackProps } from 'aws-cdk-lib';
import { type NHCEnvVariables } from '../settings';
import { BaseStack } from '../../common/base-stack';

interface NhcDbImportStackProps extends StackProps {
  envVariables: NHCEnvVariables;
}

export class NhcDbImportStack extends BaseStack {
  public readonly patientDbTable: ITable;
  public readonly healthCheckDbTable: ITable;
  public readonly orderDbTable: ITable;
  public readonly labResultDbTable: ITable;
  public readonly auditEventDbTable: ITable;
  public readonly gpOdsCodeDbTable: ITable;
  public readonly communicationLogDbTable: ITable;
  public readonly sessionDbTable: ITable;
  public readonly snomedDbTable: ITable;
  public readonly gpUpdateSchedulerDbTable: ITable;
  public readonly deadLetterMessagesDbTable: ITable;
  public readonly townsendScoreDbTable: ITable;
  public readonly postcodeLsoaDbTable: ITable;
  public readonly lsoaImdDbTable: ITable;
  public readonly mnsMessagesLogDbTable: ITable;

  constructor(scope: Construct, id: string, props: NhcDbImportStackProps) {
    super(
      scope,
      id,
      props.envVariables.common.envName,
      props.envVariables.nhcVersion
    );

    this.patientDbTable = Table.fromTableAttributes(
      this,
      'nhc-patient-db-table',
      {
        tableName: props.envVariables.dbEnvironment + '-nhc-patient-db',
        grantIndexPermissions: true
      }
    );

    this.orderDbTable = Table.fromTableAttributes(this, 'nhc-order-db-table', {
      tableName: props.envVariables.dbEnvironment + '-nhc-order-db',
      grantIndexPermissions: true
    });

    this.healthCheckDbTable = Table.fromTableAttributes(
      this,
      'nhc-health-check-db-table',
      {
        tableName: props.envVariables.dbEnvironment + '-nhc-health-check-db',
        tableStreamArn: Fn.importValue(
          `${this.envName}HealthChecksTableStreamArn`
        ),
        grantIndexPermissions: true
      }
    );

    this.labResultDbTable = Table.fromTableAttributes(
      this,
      'nhc-lab-result-db-table',
      {
        tableName: props.envVariables.dbEnvironment + '-nhc-lab-result-db',
        grantIndexPermissions: true
      }
    );

    this.auditEventDbTable = Table.fromTableAttributes(
      this,
      'nhc-audit-event-db-table',
      {
        tableName: props.envVariables.dbEnvironment + '-nhc-audit-event-db',
        tableStreamArn: Fn.importValue(
          `${this.envName}AuditEventTableStreamArn`
        ),
        grantIndexPermissions: true
      }
    );

    this.gpOdsCodeDbTable = Table.fromTableAttributes(
      this,
      'nhc-ods-code-db-table',
      {
        tableName: props.envVariables.dbEnvironment + '-nhc-ods-code-db',
        tableStreamArn: Fn.importValue(`${this.envName}OdsCodeTableStreamArn`),
        grantIndexPermissions: true
      }
    );

    this.communicationLogDbTable = Table.fromTableAttributes(
      this,
      'nhc-communication-log-db-table',
      {
        tableName:
          props.envVariables.dbEnvironment + '-nhc-communication-log-db',
        grantIndexPermissions: true
      }
    );

    this.sessionDbTable = Table.fromTableAttributes(
      this,
      'nhc-session-db-table',
      {
        tableName: props.envVariables.dbEnvironment + '-nhc-session-db',
        grantIndexPermissions: true
      }
    );

    this.snomedDbTable = Table.fromTableAttributes(
      this,
      'nhc-snomed-db-table',
      {
        tableName: props.envVariables.dbEnvironment + '-nhc-snomed-db',
        grantIndexPermissions: true
      }
    );

    this.gpUpdateSchedulerDbTable = Table.fromTableAttributes(
      this,
      'nhc-gp-update-scheduler-db-table',
      {
        tableName:
          props.envVariables.dbEnvironment + '-nhc-gp-update-scheduler-db',
        grantIndexPermissions: true
      }
    );

    this.deadLetterMessagesDbTable = Table.fromTableAttributes(
      this,
      'nhc-dead-letter-messages-db-table',
      {
        tableName:
          props.envVariables.dbEnvironment + '-nhc-dead-letter-messages-db',
        grantIndexPermissions: true
      }
    );

    this.townsendScoreDbTable = Table.fromTableAttributes(
      this,
      'nhc-townsend-db-table',
      {
        tableName: props.envVariables.db.townsendTableName,
        grantIndexPermissions: true
      }
    );

    this.postcodeLsoaDbTable = Table.fromTableAttributes(
      this,
      'nhc-postcode-lsoa-db-table',
      {
        tableName: props.envVariables.dbEnvironment + '-nhc-postcode-lsoa-db',
        grantIndexPermissions: true
      }
    );

    this.lsoaImdDbTable = Table.fromTableAttributes(
      this,
      'nhc-lsoa-imd-db-table',
      {
        tableName: props.envVariables.dbEnvironment + '-nhc-lsoa-imd-db',
        grantIndexPermissions: true
      }
    );

    this.mnsMessagesLogDbTable = Table.fromTableAttributes(
      this,
      'nhc-mns-messages-log-db-table',
      {
        tableName:
          props.envVariables.dbEnvironment + '-nhc-mns-messages-log-db',
        grantIndexPermissions: true
      }
    );
  }
}
