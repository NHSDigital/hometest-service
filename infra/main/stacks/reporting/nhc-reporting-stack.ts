import { BucketEncryption, type Bucket } from 'aws-cdk-lib/aws-s3';
import type * as lambda from 'aws-cdk-lib/aws-lambda';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { type Database } from '@aws-cdk/aws-glue-alpha';
import { type StackProps } from 'aws-cdk-lib';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal
} from 'aws-cdk-lib/aws-iam';
import { type Construct } from 'constructs';
import { BaseStack } from '../../../common/base-stack';
import { type ITable } from 'aws-cdk-lib/aws-dynamodb';
import { CfnPipe } from 'aws-cdk-lib/aws-pipes';
import { type NHCEnvVariables } from '../../settings';
import { NhcLambdaFactory } from '../../../common/nhc-lambda-factory';
import { NhcBucketFactory } from '../../../common/nhc-bucket-factory';
import { type IKey } from 'aws-cdk-lib/aws-kms';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { type NhsAlarmFactory } from '../../../common/nhc-alarm-factory';
import { createGlueResources } from './glue-resources';
import { createAthenaBIResources } from './athena-bi-resources';
import { createEvaluationExport } from './evaluator-export';
import { createEc2Resources } from './ec2-resources';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import {
  TaskInput,
  Map,
  JsonPath,
  Succeed,
  StateMachine,
  DefinitionBody,
  StateMachineType,
  LogLevel
} from 'aws-cdk-lib/aws-stepfunctions';
import { Stack } from '../../stack';
import * as path from 'path';
import * as fs from 'fs';
import { CfnNamedQuery, type CfnWorkGroup } from 'aws-cdk-lib/aws-athena';

export interface NhcReportingStackProps extends StackProps {
  auditEventTable: ITable;
  healthCheckTable: ITable;
  odsCodeTable: ITable;
  envVariables: NHCEnvVariables;
  alarmFactory: NhsAlarmFactory;
}

export class NhcReportingStack extends BaseStack {
  readonly managementAccountId: string;
  readonly kmsKeyId: string;
  readonly kmsKeyArn: string;
  readonly kmsKey: IKey;
  readonly eventBus: EventBus;
  readonly reportingBucket: Bucket;
  readonly reportingLambda: lambda.Function;
  readonly database: Database;

  constructor(scope: Construct, id: string, props: NhcReportingStackProps) {
    super(
      scope,
      id,
      props.envVariables.common.envName,
      props.envVariables.nhcVersion
    );
    if (!props.envVariables.enableReportingDataCopy) {
      console.log('Reporting stack toggled out, not deploying');
      return;
    }
    this.managementAccountId = props.envVariables.aws.managementAccountId;
    this.kmsKeyId = props.envVariables.security.kmsKeyId;
    this.kmsKeyArn = this.getKmsKeyIdentifier(
      this.managementAccountId,
      this.kmsKeyId
    );
    this.kmsKey = this.getKmsKeyById(
      this.managementAccountId,
      props.envVariables.security.kmsKeyId
    );

    const lambdaFactory = new NhcLambdaFactory(
      this,
      this.stackBaseName,
      props.envVariables,
      props.alarmFactory,
      props.envVariables.tracingEnabled,
      props.envVariables.amazonInspectorEnabled
    );

    const logGroup = new LogGroup(this, 'reporting-bus-logs', {
      logGroupName: `/aws/vendedlogs/${this.envName}-reporting-bus-logs`,
      removalPolicy: props.envVariables.aws.removalPolicy,
      retention: props.envVariables.logRetention || RetentionDays.INFINITE,
      encryptionKey: this.kmsKey
    });

    // Create EventBus
    this.eventBus = new EventBus(this, `reporting-bus`, {
      eventBusName: `${this.envName}-reporting-bus`,
      kmsKey: this.kmsKey
    });

    const reportingBucketName = `${this.account}-${this.envName}-nhc-reporting-data`;

    this.reportingLambda = lambdaFactory.createLambda({
      name: 'reporting-lambda',
      environment: {
        REPORTING_BUCKET_NAME: reportingBucketName
      }
    });

    // Create S3 bucket
    this.reportingBucket = new NhcBucketFactory().create({
      scope: this,
      id: 'reporting-bucket',
      bucketName: reportingBucketName,
      accessLoggingBucketName: props.envVariables.aws.accessLoggingBucketName,
      envType: props.envVariables.envType,
      accountNumber: this.account,
      removalPolicy: props.envVariables.aws.removalPolicy,
      additionalProps: {
        encryption: BucketEncryption.KMS,
        encryptionKey: this.kmsKey
      }
    });

    // Grant Lambda permission to write to the S3 bucket
    this.reportingBucket.grantReadWrite(this.reportingLambda);
    this.reportingLambda.grantInvoke(
      new ServicePrincipal('events.amazonaws.com')
    );

    // Create EventBridge Pipes for each DynamoDB table
    this.createEventBridgePipe(props.auditEventTable, logGroup);
    this.createEventBridgePipe(props.healthCheckTable, logGroup);
    this.createEventBridgePipe(props.odsCodeTable, logGroup);

    const rule = new Rule(this, 'EventBusLambdaTriggerRule', {
      eventBus: this.eventBus,
      eventPattern: {
        // Match all event sources
        source: [{ prefix: '' }] as any[]
      }
    });

    rule.addTarget(new targets.LambdaFunction(this.reportingLambda));
    // rule.addTarget(new targets.CloudWatchLogGroup(logGroup));

    if (!props.envVariables.enableReportingExternalIntegrations) {
      console.log('Reporting stack external integrations toggled out');
      return;
    }

    const glueResources = createGlueResources(
      this,
      props,
      this.reportingBucket
    );
    this.database = glueResources.database;

    const athenaBIResources = createAthenaBIResources(this, props, this.kmsKey);

    createEc2Resources(
      this,
      props,
      athenaBIResources.outputBucket,
      athenaBIResources.workgroup
    );

    if (
      props.envVariables.enableEvaluatorExport &&
      props.envVariables.enableReportingExternalIntegrations &&
      props.envVariables.enableReportingDataCopy
    ) {
      const evaluationExportResources = createEvaluationExport({
        scope: this,
        props,
        databaseName: this.database.databaseName,
        kmsKey: this.kmsKey
      });

      this.createAthenaViewsCreationStepFunction(
        lambdaFactory,
        evaluationExportResources.exportBucket,
        evaluationExportResources.workgroup,
        glueResources.database,
        props
      );
    }
  }

  addAthenaAndGluePolicies(
    role: Role,
    outputBucket: Bucket,
    workgroupName: string
  ): void {
    role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'athena:StartQueryExecution',
          'athena:StopQueryExecution',
          'athena:GetQueryExecution',
          'athena:GetQueryResults',
          'athena:GetQueryResultsStream',
          'athena:GetQueryRuntimeStatistics',
          'athena:GetWorkGroup',
          'athena:ListDatabases',
          'athena:ListTableMetadata'
        ],
        resources: [
          `arn:aws:athena:eu-west-2:${this.account}:workgroup/${workgroupName}`,
          `arn:aws:athena:eu-west-2:${this.account}:datacatalog/AwsDataCatalog`
        ]
      })
    );
    role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['athena:ListDataCatalogs'],
        resources: ['*']
      })
    );
    role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['s3:GetBucketLocation', 's3:GetObject', 's3:ListBucket'],
        resources: [
          outputBucket.bucketArn,
          `${outputBucket.bucketArn}/*`,
          this.reportingBucket.bucketArn,
          `${this.reportingBucket.bucketArn}/*`
        ]
      })
    );
    role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['s3:PutObject'],
        resources: [outputBucket.bucketArn, `${outputBucket.bucketArn}/*`]
      })
    );
    role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'glue:GetTable',
          'glue:GetTables',
          'glue:GetPartitions',
          'glue:GetDatabase',
          'glue:GetDatabases'
        ],
        resources: [
          `arn:aws:glue:eu-west-2:${this.account}:catalog`,
          `arn:aws:glue:eu-west-2:${this.account}:catalog/AwsDataCatalog`,
          this.database.databaseArn,
          `arn:aws:glue:eu-west-2:${this.account}:table/${this.database.databaseName}/*`
        ]
      })
    );
    role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey*'],
        resources: [
          `arn:aws:kms:eu-west-2:${this.managementAccountId}:key/${this.kmsKeyId}`
        ]
      })
    );
  }

  createEventBridgePipe(sourceTable: ITable, logGroup: LogGroup): CfnPipe {
    if (sourceTable.tableStreamArn === undefined) {
      throw new Error(
        `${sourceTable.tableName} does not have a stream defined`
      );
    }

    const pipesRoleName = `${sourceTable.tableName}-reporting-pipe-role`;

    const pipesRole = new Role(this, `${sourceTable.tableName}-pipes-role`, {
      assumedBy: new ServicePrincipal('pipes.amazonaws.com'),
      roleName: pipesRoleName
    });

    pipesRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey*'],
        resources: [
          `arn:aws:kms:eu-west-2:${this.managementAccountId}:key/${this.kmsKeyId}`
        ]
      })
    );

    sourceTable.grantStreamRead(pipesRole);
    this.eventBus.grantPutEventsTo(pipesRole);

    return new CfnPipe(this, `${sourceTable.tableName}-reporting-pipe`, {
      roleArn: pipesRole.roleArn,
      name: `nhc-reporting-stack-${sourceTable.tableName}-pipe`,
      source: sourceTable.tableStreamArn,
      target: this.eventBus.eventBusArn,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: 'TRIM_HORIZON',
          onPartialBatchItemFailure: 'AUTOMATIC_BISECT'
        }
      },
      kmsKeyIdentifier: this.kmsKeyArn,
      logConfiguration: {
        cloudwatchLogsLogDestination: {
          logGroupArn: logGroup.logGroupArn
        },
        level: 'INFO'
      }
    });
  }

  createAthenaViewsCreationStepFunction(
    lambdaFactory: NhcLambdaFactory,
    outputBucket: Bucket,
    workGroup: CfnWorkGroup,
    database: Database,
    props: NhcReportingStackProps
  ): void {
    const createAthenaViewLambda = lambdaFactory.createLambda({
      name: 'create-athena-view-lambda',
      environment: {
        ATHENA_OUTPUT_LOCATION: `s3://${outputBucket.bucketName}/`,
        DATABASE_NAME: database.databaseName,
        WORKGROUP_NAME: workGroup.name
      }
    });

    createAthenaViewLambda.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'athena:GetNamedQuery',
          'athena:StartQueryExecution',
          'athena:GetQueryExecution',
          'athena:GetWorkGroup',
          'athena:ListNamedQueries'
        ],
        resources: ['*']
      })
    );

    createAthenaViewLambda.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'glue:GetTable',
          'glue:GetDatabases',
          'glue:GetDatabase',
          'glue:UpdateTable',
          'glue:CreateTable'
        ],
        resources: [
          `arn:aws:glue:eu-west-2:${this.account}:catalog`,
          `arn:aws:glue:eu-west-2:${this.account}:catalog/AwsDataCatalog`,
          this.database.databaseArn,
          `arn:aws:glue:eu-west-2:${this.account}:table/${this.database.databaseName}/*`
        ]
      })
    );

    outputBucket.grantReadWrite(createAthenaViewLambda);

    const invokeCreateView = new LambdaInvoke(this, 'InvokeCreateAthenaView', {
      lambdaFunction: createAthenaViewLambda,
      payload: TaskInput.fromObject({
        'viewName.$': '$'
      })
    });

    const runViewsConcurrently = new Map(
      this,
      'RunFlattenedViewsConcurrently',
      {
        itemsPath: JsonPath.stringAt('$.flattenedViewNames'),
        maxConcurrency: 3
      }
    ).itemProcessor(invokeCreateView);

    const allViewsCreated = new Succeed(this, 'AllViewsProcessed');

    const definition = runViewsConcurrently.next(allViewsCreated);

    const logGroup = new LogGroup(this, 'AthenaViewsCreationLogGroup', {
      logGroupName: `/aws/vendedlogs/nhc-${this.envName}-athena-views-creation-state-machine`,
      removalPolicy: props.envVariables.aws.removalPolicy,
      retention: props.envVariables.logRetention ?? RetentionDays.INFINITE,
      encryptionKey: this.kmsKey
    });

    const stateMachine = new StateMachine(this, 'AthenaQueryRunner', {
      stateMachineName: `nhc-${this.envName}-athena-views-creation-state-machine`,
      definitionBody: DefinitionBody.fromChainable(definition),
      stateMachineType: StateMachineType.STANDARD,
      logs: {
        destination: logGroup,
        level: LogLevel.ALL,
        includeExecutionData: true
      }
    });

    stateMachine.addToRolePolicy(
      new PolicyStatement({
        actions: ['lambda:InvokeFunction'],
        resources: [createAthenaViewLambda.functionArn]
      })
    );
  }

  createFlattenedViewQueries(
    props: NhcReportingStackProps,
    workgroup: CfnWorkGroup
  ): {
    flattenedHealthCheckViewName: string;
    flattenedAuditEventViewName: string;
    flattenedBiometricScoreViewName: string;
  } {
    const flattenedHealthCheckViewName = `${props.envVariables.common.envName}-flattened-health-check-view`;
    const flattenedHealthCheckViewQuery = this.loadQuery(
      'flattened-health-check-view.sql',
      {
        flattenedHealthCheckViewName,
        healthCheckTableName: `${Stack.REPORTING}-${props.envVariables.common.envName}-health-check-table`
      }
    );

    const flattenedBiometricScoreViewName = `${props.envVariables.common.envName}-flattened-biometric-score-view`;
    const flattenedBiometricScoreViewQuery = this.loadQuery(
      'flattened-biometric-score-view.sql',
      {
        flattenedBiometricScoreViewName,
        biometricScoreTableName: `${Stack.REPORTING}-${props.envVariables.common.envName}-biometric-score-table`
      }
    );

    const flattenedAuditEventViewName = `${props.envVariables.common.envName}-flattened-audit-event-view`;
    const flattenedAuditEventViewQuery = this.loadQuery(
      'flattened-audit-event-view.sql',
      {
        flattenedAuditEventViewName,
        auditEventTableName: `${Stack.REPORTING}-${props.envVariables.common.envName}-audit-event-table`
      }
    );

    const athenaFlattenedHealthCheckViewQuery = new CfnNamedQuery(
      this,
      `${workgroup.name}-athena-flattened-hc-query`,
      {
        name: `${Stack.REPORTING}-${flattenedHealthCheckViewName}`,
        description: 'Create flattened view of health check table',
        database: this.database.databaseName,
        workGroup: workgroup.name,
        queryString: flattenedHealthCheckViewQuery
      }
    );

    const athenaFlattenedBiometricScoreViewQuery = new CfnNamedQuery(
      this,
      `${workgroup.name}-athena-flattened-bs-query`,
      {
        name: `${Stack.REPORTING}-${props.envVariables.common.envName}-flattened-biometric-score-view`,
        description: 'Create flattened view of biometric score table',
        database: this.database.databaseName,
        workGroup: workgroup.name,
        queryString: flattenedBiometricScoreViewQuery
      }
    );

    const athenaFlattenedAuditEventViewQuery = new CfnNamedQuery(
      this,
      `${workgroup.name}-athena-flattened-audit-query`,
      {
        name: `${Stack.REPORTING}-${flattenedAuditEventViewName}`,
        description: 'Create flattened view of audit event table',
        database: this.database.databaseName,
        workGroup: workgroup.name,
        queryString: flattenedAuditEventViewQuery
      }
    );

    athenaFlattenedAuditEventViewQuery.node.addDependency(workgroup);
    athenaFlattenedBiometricScoreViewQuery.node.addDependency(workgroup);
    athenaFlattenedHealthCheckViewQuery.node.addDependency(workgroup);

    return {
      flattenedHealthCheckViewName,
      flattenedAuditEventViewName,
      flattenedBiometricScoreViewName
    };
  }

  loadQuery(fileName: string, params: Record<string, string | number>): string {
    const filePath = path.join(__dirname, './sql', fileName);
    const query = fs.readFileSync(filePath, 'utf-8');
    return Object.entries(params).reduce(
      (result, [key, value]) =>
        result.replace(new RegExp(`{{${key}}}`, 'g'), String(value)),
      query
    );
  }
}
