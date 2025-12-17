import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { BaseStack } from '../../common/base-stack';
import { NhcLambdaFactory } from '../../common/nhc-lambda-factory';
import { NhcSqsQueue } from '../resources/nhc-sqs-queue';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { type Construct } from 'constructs';
import { Duration, type StackProps } from 'aws-cdk-lib';
import { type NHCEnvVariables } from '../settings';
import { type SqsRedriveSubscribeService } from './nhc-monitoring-stack';
import { type IKey } from 'aws-cdk-lib/aws-kms';
import { type ITable } from 'aws-cdk-lib/aws-dynamodb';
import { type Queue } from 'aws-cdk-lib/aws-sqs';
import { type NhsAlarmFactory } from '../../common/nhc-alarm-factory';

interface NhcPdmIntegrationProps extends StackProps {
  healthCheckTable: ITable;
  patientTable: ITable;
  labResultTable: ITable;
  snomedCodesTable: ITable;
  mnsOutboundQueue: Queue;
  envVariables: NHCEnvVariables;
  sqsRedrive: SqsRedriveSubscribeService;
  alarmFactory: NhsAlarmFactory;
}

export class NhcPdmIntegrationStack extends BaseStack {
  public readonly pdmQueue: NhcSqsQueue;
  readonly kmsKey: IKey;

  constructor(scope: Construct, id: string, props: NhcPdmIntegrationProps) {
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

    this.pdmQueue = new NhcSqsQueue({
      scope: this,
      id: 'pdm-integration',
      kmsKey: this.kmsKey,
      maxReceiveCount: +props.envVariables.sqsMaxReceiveCount,
      alarmFactory: props.alarmFactory
    });

    props.sqsRedrive.subscribe(this.pdmQueue);

    const lambdaFactory = new NhcLambdaFactory(
      this,
      this.stackBaseName,
      props.envVariables,
      props.alarmFactory,
      props.envVariables.tracingEnabled,
      props.envVariables.amazonInspectorEnabled
    );

    const pdmIntegrationLambda = lambdaFactory.createLambda({
      name: 'pdm-integration-lambda',
      additionalProps: {
        timeout: Duration.seconds(30),
        bundling: {
          commandHooks: {
            afterBundling(inputDir: string, outputDir: string): string[] {
              return [
                `cp -r ${inputDir}/node_modules/digital-health-checks-fhir-translator/src/mappings ${outputDir}`,
                `cp -r ${inputDir}/node_modules/digital-health-checks-fhir-translator/src/templates ${outputDir}`
              ];
            },
            beforeBundling(): string[] {
              return [];
            },
            beforeInstall(): string[] {
              return [];
            }
          }
        }
      },
      environment: {
        NHS_API_PLATFORM_BASE_URL: props.envVariables.nhsApiPlatform.baseUrl,
        NHS_API_PLATFORM_API_KEY_SECRET_NAME:
          props.envVariables.nhsApiPlatform.apiKeySecretName,
        NHS_API_PLATFORM_PRIVATE_KEY_SECRET_NAME:
          props.envVariables.nhsApiPlatform.privateKeySecretName,
        NHS_API_PLATFORM_KEY_ID: props.envVariables.nhsApiPlatform.keyId,
        MNS_OUTBOUND_QUEUE_URL: props.mnsOutboundQueue.queueUrl
      },
      alarmConfig: { createLambdaErrorAlarm: false }
    });

    pdmIntegrationLambda.addEventSource(
      new SqsEventSource(this.pdmQueue.mainQueue, {
        reportBatchItemFailures: true,
        batchSize: 1
      })
    );

    // QUEUE PERMISSIONS
    this.pdmQueue.mainQueue.grantConsumeMessages(pdmIntegrationLambda);
    props.mnsOutboundQueue.grantSendMessages(pdmIntegrationLambda);

    // LAMBDA PERMISSIONS
    props.healthCheckTable.grantReadData(pdmIntegrationLambda);
    props.patientTable.grantReadData(pdmIntegrationLambda);
    props.labResultTable.grantReadData(pdmIntegrationLambda);
    props.snomedCodesTable.grantReadData(pdmIntegrationLambda);

    // SECRET PERMISSIONS
    const apiKey = Secret.fromSecretNameV2(
      this,
      'pdm-api-key',
      props.envVariables.nhsApiPlatform.apiKeySecretName
    );
    apiKey.grantRead(pdmIntegrationLambda);

    const privateKey = Secret.fromSecretNameV2(
      this,
      'pdm-private-key',
      props.envVariables.nhsApiPlatform.privateKeySecretName
    );
    privateKey.grantRead(pdmIntegrationLambda);
  }
}
