import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { CfnOutput, Duration, Fn, type StackProps } from 'aws-cdk-lib';
import type * as sqs from 'aws-cdk-lib/aws-sqs';
import { type Construct } from 'constructs';
import {
  BaseStack,
  addEnvPrefixToPhysicalId,
  translateRegionToCSOCDestinationArn,
  ApiGatewayCustomLogFormat
} from '../../common/base-stack';
import { type ITable } from 'aws-cdk-lib/aws-dynamodb';
import { type NhcLambdaFunction } from '../../common/nhc-lambda-function';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { type NHCEnvVariables } from '../settings';
import { NhcSqsQueue } from '../resources/nhc-sqs-queue';

import {
  SqsEventSource,
  DynamoEventSource
} from 'aws-cdk-lib/aws-lambda-event-sources';
import { ResourceNamingService } from '../../common/resource-naming-service';
import {
  type ILogGroup,
  LogGroup,
  MetricFilter,
  RetentionDays,
  CfnSubscriptionFilter
} from 'aws-cdk-lib/aws-logs';
import {
  CognitoUserPoolsAuthorizer,
  MethodLoggingLevel,
  RestApi
} from 'aws-cdk-lib/aws-apigateway';
import { CfnWebACLAssociation } from 'aws-cdk-lib/aws-wafv2';
import * as cdk from 'aws-cdk-lib';
import { NhcLambdaFactory } from '../../common/nhc-lambda-factory';
import { NhcBucketFactory } from '../../common/nhc-bucket-factory';
import { BucketEncryption, Bucket } from 'aws-cdk-lib/aws-s3';
import { CrossAccountRoute53RecordSet } from 'cdk-cross-account-route53';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGateway } from 'aws-cdk-lib/aws-route53-targets';
import {
  Certificate,
  type ICertificate
} from 'aws-cdk-lib/aws-certificatemanager';
import { TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import {
  OAuthScope,
  ResourceServerScope,
  UserPool,
  type UserPoolDomain
} from 'aws-cdk-lib/aws-cognito';
import { type SqsRedriveSubscribeService } from './nhc-monitoring-stack';
import { type IKey } from 'aws-cdk-lib/aws-kms';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import {
  CompositePrincipal,
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal
} from 'aws-cdk-lib/aws-iam';
import { type NhsAlarmFactory } from '../../common/nhc-alarm-factory';
import path = require('path');
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import {
  FilterCriteria,
  FilterRule,
  StartingPosition
} from 'aws-cdk-lib/aws-lambda';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { NhcTopic } from '../../common/lib/enums';

interface NhcResultsStackProps extends StackProps {
  healthCheckTable: ITable;
  orderTable: ITable;
  labResultTable: ITable;
  patientTable: ITable;
  snomedTable: ITable;
  odsCodeTable: ITable;
  communicationLogTable: ITable;
  qriskFailuresMetric: string;
  auditEventsQueue: sqs.Queue;
  pdmQueue: sqs.Queue;
  envVariables: NHCEnvVariables;
  sqsRedrive: SqsRedriveSubscribeService;
  alarmFactory: NhsAlarmFactory;
}

const EMIS_FUNCTIONS_DURATION_SECONDS = 60;

export class NhcResultsStack extends BaseStack {
  private readonly custom4xxErrorsMetricName = '4XXError_Excluding_401_403_404';
  private readonly customResultsApiMetricNamespace;
  private readonly metricFilter4xxErrors: MetricFilter | undefined;
  private readonly namingService: ResourceNamingService;
  readonly kmsKey: IKey;
  public getActiveUserLambda: NhcLambdaFunction;
  public emisPayloadBucket: Bucket;
  public updatePatientRecordLambdaLogGroup: ILogGroup;
  public gpNotificationQueue: NhcSqsQueue;
  public communicationQueue: NhcSqsQueue;

  constructor(scope: Construct, id: string, props: NhcResultsStackProps) {
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
    const lambdaFactory = new NhcLambdaFactory(
      this,
      this.stackBaseName,
      props.envVariables,
      props.alarmFactory,
      props.envVariables.tracingEnabled,
      props.envVariables.amazonInspectorEnabled
    );

    this.namingService = new ResourceNamingService(
      props.envVariables.common.envName
    );

    // create queues
    this.communicationQueue = new NhcSqsQueue({
      scope: this,
      id: 'communications',
      kmsKey: this.kmsKey,
      maxReceiveCount: +props.envVariables.sqsMaxReceiveCount,
      alarmFactory: props.alarmFactory
    });
    props.sqsRedrive.subscribe(this.communicationQueue);

    const updatePatientRecordQueue = new NhcSqsQueue({
      scope: this,
      id: 'update-patient-record',
      kmsKey: this.kmsKey,
      isFifo: true,
      additionalProperties: {
        visibilityTimeout: Duration.seconds(EMIS_FUNCTIONS_DURATION_SECONDS + 5)
      },
      maxReceiveCount: +props.envVariables.sqsMaxReceiveCount,
      alarmFactory: props.alarmFactory
    });
    props.sqsRedrive.subscribe(updatePatientRecordQueue);

    const riskCalcQueue = new NhcSqsQueue({
      scope: this,
      id: 'risk-calc',
      kmsKey: this.kmsKey,
      maxReceiveCount: +props.envVariables.sqsMaxReceiveCount,
      alarmFactory: props.alarmFactory
    });
    props.sqsRedrive.subscribe(riskCalcQueue);

    this.gpNotificationQueue = new NhcSqsQueue({
      scope: this,
      id: 'gp-notification',
      kmsKey: this.kmsKey,
      maxReceiveCount: +props.envVariables.sqsMaxReceiveCount,
      alarmFactory: props.alarmFactory
    });
    props.sqsRedrive.subscribe(this.gpNotificationQueue);

    const gpNotificationLambda = lambdaFactory.createLambda({
      name: 'gp-notification-lambda',
      environment: {
        GP_NOTIFICATION_SMTP_HOST: props.envVariables.gpNotificationSMTP.host,
        GP_NOTIFICATION_SMTP_PORT: props.envVariables.gpNotificationSMTP.port,
        GP_NOTIFICATION_SMTP_USERNAME_SECRET_NAME:
          props.envVariables.gpNotificationSMTP.usernameSecretName,
        GP_NOTIFICATION_SMTP_PASSWORD_SECRET_NAME:
          props.envVariables.gpNotificationSMTP.passwordSecretName,
        GP_NOTIFICATION_SMTP_ENABLE_SEND_CUSTOM_HEADER:
          props.envVariables.gpNotificationSMTP.enableSendCustomHeader,
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl
      },
      additionalProps: {
        timeout: Duration.seconds(30), // to allow for SMTP connection timeouts
        bundling: {
          commandHooks: {
            beforeBundling(inputDir: string, outputDir: string): string[] {
              const templatesDir = path.join(
                inputDir,
                'src/nhc-result-stack/gp-notification-lambda/templates'
              );

              return [`cp -r ${templatesDir} ${outputDir}`];
            },
            afterBundling(): string[] {
              return [''];
            },
            beforeInstall(): string[] {
              return [''];
            }
          }
        }
      },
      alarmConfig: { createLambdaErrorAlarm: true }
    });
    props.patientTable.grantReadData(gpNotificationLambda);
    props.odsCodeTable.grantReadData(gpNotificationLambda);
    props.healthCheckTable.grantReadData(gpNotificationLambda);
    props.auditEventsQueue.grantSendMessages(gpNotificationLambda);

    const gpNotifySmtpUserSecret = Secret.fromSecretNameV2(
      this,
      'gp-notify-smtp-user',
      props.envVariables.gpNotificationSMTP.usernameSecretName
    );
    const gpNotifySmtpPasswordSecret = Secret.fromSecretNameV2(
      this,
      'gp-notify-smtp-password',
      props.envVariables.gpNotificationSMTP.passwordSecretName
    );
    gpNotifySmtpUserSecret.grantRead(gpNotificationLambda);
    gpNotifySmtpPasswordSecret.grantRead(gpNotificationLambda);

    this.gpNotificationQueue.mainQueue.grantConsumeMessages(
      gpNotificationLambda
    );

    gpNotificationLambda.addEventSource(
      new SqsEventSource(this.gpNotificationQueue.mainQueue, {
        reportBatchItemFailures: true,
        batchSize: 1,
        maxConcurrency: 3 // limit concurrency to same as number of allowed SMTP connections
      })
    );

    this.customResultsApiMetricNamespace = `${this.envName} Results API metrics`;

    // create lambdas
    const communicationSendLambda = lambdaFactory.createLambda({
      name: 'communication-send-lambda',
      environment: {
        NHS_API_PLATFORM_BASE_URL: props.envVariables.nhsApiPlatform.baseUrl,
        NHS_API_PLATFORM_API_KEY_SECRET_NAME:
          props.envVariables.nhsApiPlatform.apiKeySecretName,
        NHS_API_PLATFORM_PRIVATE_KEY_SECRET_NAME:
          props.envVariables.nhsApiPlatform.privateKeySecretName,
        NHS_API_PLATFORM_KEY_ID: props.envVariables.nhsApiPlatform.keyId,
        NOTIFY_ROUTING_PLAN_ID_MAP: JSON.stringify(
          props.envVariables.notify.routingPlanIdMap
        ),
        NOTIFY_JWT_EXPIRATION_TIME_SECONDS:
          props.envVariables.notify.jwtExpirationTimeSeconds,
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl,
        NOTIFY_DB_COMMUNICATION_LOGS_TTL_DAYS:
          props.envVariables.notify.dbCommunicationLogsTtlDays
      },
      alarmConfig: { createLambdaErrorAlarm: false }
    });
    props.patientTable.grantReadData(communicationSendLambda);
    props.auditEventsQueue.grantSendMessages(communicationSendLambda);
    props.healthCheckTable.grantReadWriteData(communicationSendLambda);
    props.communicationLogTable.grantWriteData(communicationSendLambda);

    const notifyApiKeySecret = Secret.fromSecretNameV2(
      this,
      'notify-api-key',
      props.envVariables.nhsApiPlatform.apiKeySecretName
    );
    const notifyPrivateKey = Secret.fromSecretNameV2(
      this,
      'notify-private-key',
      props.envVariables.nhsApiPlatform.privateKeySecretName
    );

    notifyApiKeySecret.grantRead(communicationSendLambda);
    notifyPrivateKey.grantRead(communicationSendLambda);

    const { updatePatientRecordLambda, getActiveUserLambda } =
      this.createEmisFunctions(lambdaFactory, props, {
        updatePatientRecordQueue,
        communicationQueue: this.communicationQueue,
        gpNotificationQueue: this.gpNotificationQueue
      });

    this.getActiveUserLambda = getActiveUserLambda;

    // Create auto-gp-onboarding-lambda after getActiveUserLambda is defined
    this.createAutoGpOnboardingLambda(lambdaFactory, props);

    this.communicationQueue.mainQueue.grantConsumeMessages(
      communicationSendLambda
    );
    this.communicationQueue.mainQueue.grantSendMessages(
      updatePatientRecordLambda
    );
    communicationSendLambda.addEventSource(
      new SqsEventSource(this.communicationQueue.mainQueue, {
        reportBatchItemFailures: true,
        batchSize: 1
      })
    );

    const riskCalcLambda = lambdaFactory.createLambda({
      name: 'risk-calc-lambda',
      environment: {
        API_URL: props.envVariables.riskCalculation.baseApiUrl,
        API_KEY_SECRET_NAME:
          props.envVariables.riskCalculation.apiKeySecretName,
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl,
        QRISK_FAILURE_METRIC_NAME: props.qriskFailuresMetric,
        UPDATE_PATIENT_RECORD_QUEUE_URL:
          updatePatientRecordQueue.mainQueue.queueUrl
      },
      alarmConfig: { createLambdaErrorAlarm: false }
    });
    props.patientTable.grantReadData(riskCalcLambda);
    props.labResultTable.grantReadData(riskCalcLambda);
    props.healthCheckTable.grantReadWriteData(riskCalcLambda);
    props.auditEventsQueue.grantSendMessages(riskCalcLambda);
    updatePatientRecordQueue.mainQueue.grantSendMessages(riskCalcLambda);

    const qCalcApiKeySecretName = Secret.fromSecretNameV2(
      this,
      `qcalc-api-key-${props.envVariables.common.envName}`,
      props.envVariables.riskCalculation.apiKeySecretName
    );
    qCalcApiKeySecretName.grantRead(riskCalcLambda);

    const processLabResultLambda = lambdaFactory.createLambda({
      name: 'process-lab-result-lambda',
      environment: {
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl,
        RISK_CALC_QUEUE_URL: riskCalcQueue.mainQueue.queueUrl,
        UPDATE_PATIENT_RECORD_QUEUE_URL:
          updatePatientRecordQueue.mainQueue.queueUrl
      },
      alarmConfig: {
        createLambdaErrorAlarm: true,
        createLambdaThrottlesAlarm: true,
        createLambdaDurationAlarm: false,
        createLambdaNotInvokedAlarm: false
      }
    });

    props.patientTable.grantReadData(processLabResultLambda);
    props.orderTable.grantReadData(processLabResultLambda);
    props.labResultTable.grantReadWriteData(processLabResultLambda);
    props.healthCheckTable.grantReadWriteData(processLabResultLambda);
    props.auditEventsQueue.grantSendMessages(processLabResultLambda);
    updatePatientRecordQueue.mainQueue.grantSendMessages(
      processLabResultLambda
    );

    riskCalcQueue.mainQueue.grantConsumeMessages(riskCalcLambda);
    riskCalcQueue.mainQueue.grantSendMessages(processLabResultLambda);
    riskCalcLambda.addEventSource(
      new SqsEventSource(riskCalcQueue.mainQueue, {
        reportBatchItemFailures: true,
        batchSize: 1
      })
    );

    const apiLogGroup = new LogGroup(this, 'results-api-gateway-logs', {
      logGroupName: this.namingService.getEnvSpecificResourceName(
        'results-api-gateway-logs'
      ),
      removalPolicy: props.envVariables.aws.removalPolicy,
      retention: props.envVariables.logRetention || RetentionDays.INFINITE,
      encryptionKey: this.kmsKey
    });

    // Create a role for API Gateway to write logs
    if (props.envVariables.csocLogForwardingEnabled) {
      const apiGatewayCSOCLogsRole = new Role(this, 'apiGatewayCSOCLogsRole', {
        assumedBy: new CompositePrincipal(
          new ServicePrincipal(`logs.${this.region}.amazonaws.com`),
          new ServicePrincipal('logs.us-east-1.amazonaws.com')
        ),
        roleName: `${this.namingService.getEnvSpecificResourceName('results-api-gateway-logs')}-csoc-role`
      });
      apiGatewayCSOCLogsRole.addToPolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['logs:PutSubscriptionFilter'],
          resources: [
            translateRegionToCSOCDestinationArn(this.region),
            apiLogGroup.logGroupArn
          ]
        })
      );
      new CfnSubscriptionFilter(this, 'CSOCSubscriptionFilter', {
        destinationArn: translateRegionToCSOCDestinationArn(this.region),
        filterPattern: '',
        logGroupName: apiLogGroup.logGroupName,
        roleArn: apiGatewayCSOCLogsRole.roleArn,
        filterName: 'central_waf_logs'
      });
    }

    const apiDomain = props.envVariables.aws.resultsApiDomainName;

    const cert = Certificate.fromCertificateArn(
      this,
      'results-api-cert',
      props.envVariables.aws.resultsApiGatewayCertificateArn
    );

    const api = new RestApi(this, 'health-check-results-api', {
      cloudWatchRole: false,
      restApiName: addEnvPrefixToPhysicalId(
        this.envName,
        'health-check-results-api'
      ),
      disableExecuteApiEndpoint: !props.envVariables.executeApiEndpointEnabled,
      description: 'health check results api gateway',
      deployOptions: {
        stageName: 'dev',
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: ApiGatewayCustomLogFormat,
        loggingLevel: MethodLoggingLevel.INFO,
        metricsEnabled: props.envVariables.alarmsEnabled,
        tracingEnabled: props.envVariables.tracingEnabled
      },
      domainName: {
        domainName: apiDomain,
        certificate: cert
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL]
      },
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.NONE
      }
    });

    if (props.envVariables.alarmsEnabled) {
      this.metricFilter4xxErrors = new MetricFilter(
        this,
        'results-api-gateway-logs-metric-filter-4xx',
        {
          logGroup: apiLogGroup,
          filterPattern: {
            logPatternString: `{ $.status = %400|402|40[5-9]|41[0-9]|42[0-9]% }`
          },
          metricNamespace: this.customResultsApiMetricNamespace,
          metricName: this.custom4xxErrorsMetricName,
          metricValue: '1'
        }
      );

      this.createApiAlarm401(api, apiLogGroup, props.alarmFactory);
    }

    const userPool = new UserPool(this, 'results-user-pool', {
      userPoolName:
        this.namingService.getEnvSpecificResourceName('results-user-pool'),
      selfSignUpEnabled: false,
      removalPolicy: props.envVariables.aws.removalPolicy
    });

    const domainName = props.envVariables.aws.cloudfrontDomainName;
    const authApiDomain = `auth-${props.envVariables.aws.backendApiDomainName}`;

    const authApiDomainCert = Certificate.fromCertificateArn(
      this,
      'auth-api-domain-cert',
      props.envVariables.aws.authDomainCertificateArn
    );

    const resourceServerScope = new ResourceServerScope({
      scopeName: 'write',
      scopeDescription: 'Write access for lab results'
    });

    const resourceServer = userPool.addResourceServer('resource-server', {
      identifier: 'results',
      scopes: [resourceServerScope]
    });

    userPool.addClient('thriva-app-client', {
      userPoolClientName: 'ThrivaAppClient',
      generateSecret: true,
      oAuth: {
        flows: {
          clientCredentials: true
        },
        scopes: [OAuthScope.resourceServer(resourceServer, resourceServerScope)]
      },
      idTokenValidity: Duration.hours(3),
      accessTokenValidity: Duration.hours(3)
    });

    let userPoolDomain: UserPoolDomain;
    // int, test and prod
    if (props.envVariables.aws.createRoute53RecordsInManagementAccount) {
      userPoolDomain = userPool.addDomain('custom-domain', {
        customDomain: {
          domainName: authApiDomain,
          certificate: authApiDomainCert
        }
      });
    } else {
      userPoolDomain = userPool.addDomain('cognito-domain', {
        cognitoDomain: {
          domainPrefix: `${this.envName}-results`
        }
      });
    }

    const authorizer = new CognitoUserPoolsAuthorizer(
      this,
      'cognito-authorizer',
      {
        cognitoUserPools: [userPool]
      }
    );

    new CfnWebACLAssociation(this, 'BackendAPIGWRegionalWafAssociation', {
      resourceArn: api.deploymentStage.stageArn,
      webAclArn: ssm.StringParameter.fromStringParameterName(
        this,
        'wafARNResultStack',
        'IntegratorAPIGWWafv5ARN'
      ).stringValue
    });

    const resultsApi = api.root.addResource('results');
    resultsApi.addMethod(
      'POST',
      new apigateway.LambdaIntegration(processLabResultLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: [`results/write`]
      }
    );

    this.createApiAlarms(api, props.alarmFactory);

    if (props.envVariables.aws.createRoute53RecordsInManagementAccount) {
      this.createRoute53RecordInManagementAccount(
        props.envVariables,
        `auth-results-api`,
        authApiDomain,
        userPoolDomain.cloudFrontEndpoint,
        props.envVariables.aws.cloudfrontHostedZoneId
      );

      this.createRoute53RecordInManagementAccount(
        props.envVariables,
        `results-api`,
        apiDomain,
        api.domainName?.domainNameAliasDomainName ?? '',
        api.domainName?.domainNameAliasHostedZoneId ?? ''
      );
    } else {
      this.createRoute53RecordInCurrentAccount(
        props,
        'results-api',
        domainName,
        apiDomain,
        RecordTarget.fromAlias(new ApiGateway(api))
      );
    }

    if (props.envVariables.resultsAPI.mtlsEndpointEnabled) {
      const mtlsCert = Certificate.fromCertificateArn(
        this,
        'mtls-results-api-cert',
        props.envVariables.aws.mtlsResultsApiGatewayCertificateArn
      );
      this.createMTLSResultsAPI(props, mtlsCert, processLabResultLambda);
    }

    new CfnOutput(this, 'ResultApiBaseUrl', {
      value: api.url
    });

    new CfnOutput(this, 'ResultsCognitoUrl', {
      value: props.envVariables.aws.createRoute53RecordsInManagementAccount
        ? `https://${userPoolDomain.domainName}/oauth2/token`
        : `https://${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com/oauth2/token`
    });
  }

  createMTLSResultsAPI(
    props: NhcResultsStackProps,
    certificate: ICertificate,
    processLabResultLambda: NhcLambdaFunction
  ): void {
    const truststoreBucket = Bucket.fromBucketName(
      this,
      'nhc-truststore-bucket',
      `${this.account}-truststore-bucket`
    );
    const apiDomain = `${props.envVariables.aws.resultsMtlsApiDomainName}`;
    const apiLogGroup = new LogGroup(this, 'results-mtls-api-gateway-logs', {
      logGroupName: this.namingService.getEnvSpecificResourceName(
        'results-mtls-api-gateway-logs'
      ),
      removalPolicy: props.envVariables.aws.removalPolicy,
      retention: props.envVariables.logRetention || RetentionDays.INFINITE,
      encryptionKey: this.kmsKey
    });

    const api = new RestApi(this, 'health-check-results-mtls-api', {
      cloudWatchRole: false,
      restApiName: addEnvPrefixToPhysicalId(
        this.envName,
        'health-check-results-mtls-api'
      ),
      disableExecuteApiEndpoint: true,
      description: 'health check results api gateway with mtls protection',
      deployOptions: {
        stageName: 'dev',
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: ApiGatewayCustomLogFormat,
        loggingLevel: MethodLoggingLevel.INFO,
        metricsEnabled: props.envVariables.alarmsEnabled,
        tracingEnabled: props.envVariables.tracingEnabled
      },
      domainName: {
        domainName: apiDomain,
        certificate: certificate,
        securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
        mtls: {
          bucket: truststoreBucket,
          key: 'results_mtls_ca_bundle.pem' // name of the mTLS CA bundle in the S3 truststore bucket
        }
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL]
      }
    });

    if (api.domainName) {
      api.domainName.node.addDependency(truststoreBucket);
    }

    const resultsMTLSApi = api.root.addResource('results');
    resultsMTLSApi.addMethod(
      'POST',
      new apigateway.LambdaIntegration(processLabResultLambda)
    );
    const resultsMTLSHealthCheckApi = api.root.addResource('_status');
    resultsMTLSHealthCheckApi.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/health+json': `{ "status": "pass", "version": "1.0.0", "description": "Health of the health check results api", "revision": "", "releaseId": "", "commitId": "", "checks": { "healthcheckService:status": [ { "status": "pass", "timeout": false, "responseCode": 200, "outcome": "<html><h1>Ok</h1></html", "links": { "self": "https://${apiDomain}/_status" } } ] } }`
            }
          }
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/health+json': '{ "statusCode": 200 }'
        }
      }),
      {
        methodResponses: [
          {
            statusCode: '200'
          }
        ]
      }
    );

    if (props.envVariables.aws.createRoute53RecordsInManagementAccount) {
      this.createRoute53RecordInManagementAccount(
        props.envVariables,
        `mtls-results-api-custom-domain-record`,
        apiDomain,
        api.domainName?.domainNameAliasDomainName ?? '',
        api.domainName?.domainNameAliasHostedZoneId ?? ''
      );
    } else {
      // Add DNS record for the mTLS domain for poc, this record links custom domain to the API Gateway
      this.createRoute53RecordInCurrentAccount(
        props,
        'mtls-results-api-custom-domain-record',
        props.envVariables.aws.cloudfrontDomainName,
        apiDomain,
        RecordTarget.fromAlias(new ApiGateway(api))
      );
    }

    new CfnOutput(this, 'MtlsResultApiBaseUrl', {
      value: `https://${apiDomain}`
    });
  }

  createEmisFunctions(
    lambdaFactory: NhcLambdaFactory,
    props: NhcResultsStackProps,
    queues: {
      updatePatientRecordQueue: NhcSqsQueue;
      communicationQueue: NhcSqsQueue;
      gpNotificationQueue: NhcSqsQueue;
    }
  ): Record<string, NhcLambdaFunction> {
    this.emisPayloadBucket = new NhcBucketFactory().create({
      scope: this,
      id: 'nhc-emis-request-payload-bucket',
      bucketName: `${this.account}-${this.envName}-nhc-emis-request-payload-bucket`,
      accessLoggingBucketName: props.envVariables.aws.accessLoggingBucketName,
      envType: props.envVariables.envType,
      accountNumber: this.account,
      removalPolicy: props.envVariables.aws.removalPolicy,
      currentVersionExpirationDays: 30,
      additionalProps: {
        encryption: BucketEncryption.KMS,
        encryptionKey: this.kmsKey
      }
    });

    const getActiveUserLambdaId = 'get-active-user-lambda';

    const emisEnvVars = {
      EMIS_MACHINE_NAME: props.envVariables.emis.machineName,
      EMIS_PRIVATE_KEY_SECRET_NAME:
        props.envVariables.emis.privateKeySecretName,
      EMIS_PUBLIC_CERT_SECRET_NAME:
        props.envVariables.emis.publicCertSecretName,
      EMIS_CERTIFICATE_COMMON_NAME:
        props.envVariables.emis.certificateCommonName
    };

    const updatePatientRecordLambda = lambdaFactory.createLambda({
      name: 'update-patient-record-lambda',
      additionalProps: {
        timeout: Duration.seconds(EMIS_FUNCTIONS_DURATION_SECONDS),
        bundling: {
          commandHooks: {
            beforeBundling(inputDir: string, outputDir: string): string[] {
              const certFilePath = path.join(
                __dirname,
                '../../../data/certs/ca_bundle.pem'
              );
              return [`cp ${certFilePath} ${outputDir}/ca_bundle.pem`];
            },
            afterBundling(): string[] {
              return [''];
            },
            beforeInstall(): string[] {
              return [''];
            }
          }
        }
      },
      environment: {
        NODE_EXTRA_CA_CERTS: '/var/task/ca_bundle.pem',
        ...emisEnvVars,
        EMIS_FILE_RECORD_CONFIG: JSON.stringify({
          ...props.envVariables.emis.commonPayloadConfig,
          ...props.envVariables.emis.fileRecordPayloadConfig,
          apiUrl: props.envVariables.emis.transactionApiUri
        }),
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl,
        PDM_QUEUE_URL: props.pdmQueue.queueUrl,
        COMMUNICATION_QUEUE_URL: queues.communicationQueue.mainQueue.queueUrl,
        GP_NOTIFICATION_QUEUE_URL:
          queues.gpNotificationQueue.mainQueue.queueUrl,
        GET_ACTIVE_USER_LAMBDA_NAME:
          this.namingService.getEnvSpecificResourceName(getActiveUserLambdaId),
        EMIS_PAYLOAD_BUCKET_NAME: this.emisPayloadBucket.bucketName,
        SQS_MAX_RECEIVE_COUNT: props.envVariables.sqsMaxReceiveCount
      },
      alarmConfig: { createLambdaErrorAlarm: false }
    });
    this.updatePatientRecordLambdaLogGroup = updatePatientRecordLambda.logGroup;

    props.healthCheckTable.grantReadWriteData(updatePatientRecordLambda);
    props.snomedTable.grantReadData(updatePatientRecordLambda);
    props.labResultTable.grantReadData(updatePatientRecordLambda);
    props.odsCodeTable.grantReadData(updatePatientRecordLambda);
    props.auditEventsQueue.grantSendMessages(updatePatientRecordLambda);
    props.pdmQueue.grantSendMessages(updatePatientRecordLambda);
    queues.updatePatientRecordQueue.mainQueue.grantConsumeMessages(
      updatePatientRecordLambda
    );
    queues.gpNotificationQueue.mainQueue.grantSendMessages(
      updatePatientRecordLambda
    );
    updatePatientRecordLambda.addEventSource(
      new SqsEventSource(queues.updatePatientRecordQueue.mainQueue, {
        reportBatchItemFailures: true,
        batchSize: 1
      })
    );
    this.emisPayloadBucket.grantWrite(updatePatientRecordLambda);

    const getActiveUserLambda = lambdaFactory.createLambda({
      name: getActiveUserLambdaId,
      additionalProps: {
        timeout: Duration.seconds(EMIS_FUNCTIONS_DURATION_SECONDS),
        bundling: {
          commandHooks: {
            beforeBundling(inputDir: string, outputDir: string): string[] {
              const certFilePath = path.join(
                __dirname,
                '../../../data/certs/ca_bundle.pem'
              );
              return [`cp ${certFilePath} ${outputDir}/ca_bundle.pem`];
            },
            afterBundling(): string[] {
              return [''];
            },
            beforeInstall(): string[] {
              return [''];
            }
          }
        }
      },
      environment: {
        NODE_EXTRA_CA_CERTS: '/var/task/ca_bundle.pem',
        ...emisEnvVars,
        EMIS_GET_USERS_CONFIG: JSON.stringify({
          ...props.envVariables.emis.commonPayloadConfig,
          ...props.envVariables.emis.getActiveUsersPayloadConfig,
          apiUrl: props.envVariables.emis.transactionApiUri
        }),
        EMIS_PAYLOAD_BUCKET_NAME: this.emisPayloadBucket.bucketName
      }
    });
    props.odsCodeTable.grantWriteData(getActiveUserLambda);
    getActiveUserLambda.grantInvoke(updatePatientRecordLambda);
    this.emisPayloadBucket.grantWrite(getActiveUserLambda);

    const emisPrivateKey = Secret.fromSecretNameV2(
      this,
      'emis-private-key',
      props.envVariables.emis.privateKeySecretName
    );
    emisPrivateKey.grantRead(updatePatientRecordLambda);
    emisPrivateKey.grantRead(getActiveUserLambda);

    const emisPublicCert = Secret.fromSecretNameV2(
      this,
      'emis-public-cert',
      props.envVariables.emis.publicCertSecretName
    );
    emisPublicCert.grantRead(updatePatientRecordLambda);
    emisPublicCert.grantRead(getActiveUserLambda);

    return {
      updatePatientRecordLambda,
      getActiveUserLambda
    };
  }

  private createApiAlarms(api: RestApi, alarmFactory: NhsAlarmFactory): void {
    this.createApplication4XXApiAlarm(api.restApiName, alarmFactory);
    alarmFactory.create(this, '5xxErrorAlarm', {
      metric: api.metric(`5XXError`, {
        statistic: cloudwatch.Stats.SUM,
        period: cdk.Duration.minutes(1)
      }),
      alarmName: this.namingService.getEnvSpecificResourceName(
        `results-api-5xx-error`
      ),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Triggers if there are any 5XX errors in the API.',
      treatMissingData: TreatMissingData.NOT_BREACHING,
      actionsEnabled: true
    });
  }

  private createApplication4XXApiAlarm(
    apiName: string,
    alarmFactory: NhsAlarmFactory
  ): cloudwatch.Alarm | null {
    if (!this.metricFilter4xxErrors) {
      return null;
    }

    const alarmProps: cloudwatch.AlarmProps = {
      alarmName: `${apiName}-Custom4XXErrorAlarm`,
      alarmDescription:
        'Triggers if there are any 4XX errors (except 401, 403, 404)',
      threshold: 0.2,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      actionsEnabled: true,
      metric: this.metricFilter4xxErrors.metric({
        statistic: cloudwatch.Stats.AVERAGE,
        period: cdk.Duration.hours(3)
      })
    };

    return alarmFactory.create(
      this,
      `${apiName}-4xx-exclude-alarm`,
      alarmProps
    );
  }

  private createApiAlarm401(
    api: RestApi,
    apiLogGroup: LogGroup,
    alarmFactory: NhsAlarmFactory
  ): cloudwatch.Alarm | null {
    const metricFilter401 = new MetricFilter(
      this,
      `${api.restApiName}-gateway-logs-metric-filter-401`,
      {
        logGroup: apiLogGroup,
        filterPattern: {
          logPatternString: `{ $.status = %401% }`
        },
        metricNamespace: this.customResultsApiMetricNamespace,
        metricName: '401Error',
        metricValue: '1'
      }
    );

    const percentage401Errors = new cloudwatch.MathExpression({
      expression: '(errors401 / totalCalls) * 100',
      usingMetrics: {
        errors401: metricFilter401.metric({
          statistic: cloudwatch.Stats.SAMPLE_COUNT,
          period: cdk.Duration.minutes(15)
        }),
        totalCalls: api.metricCount({ period: cdk.Duration.minutes(15) })
      },
      period: cdk.Duration.minutes(15)
    });

    const alarm401Props = {
      metric: percentage401Errors,
      alarmName: this.namingService.getEnvSpecificResourceName(
        `${api.restApiName}-401-error-alarm`
      ),
      threshold: 90,
      datapointsToAlarm: 3,
      evaluationPeriods: 5,
      alarmDescription: `Triggers if there are over 90% 401 errors in the ${api.restApiName} API.`,
      treatMissingData: TreatMissingData.NOT_BREACHING,
      actionsEnabled: true
    };

    return alarmFactory.create(
      this,
      `${api.restApiName}-401-error-alarm`,
      alarm401Props
    );
  }

  private createRoute53RecordInManagementAccount(
    envVariables: NHCEnvVariables,
    constructName: string,
    apiDomain: string,
    targetDomain: string,
    targetHostedZoneId: string
  ): void {
    new CrossAccountRoute53RecordSet(this, `${constructName}-dns-record`, {
      delegationRoleName: envVariables.aws.managementAccountRoute53RoleName,
      delegationRoleAccount: envVariables.aws.managementAccountId,
      hostedZoneId: envVariables.aws.hostedZoneId,
      resourceRecordSets: [
        {
          Name: apiDomain,
          Type: 'A',
          AliasTarget: {
            DNSName: targetDomain,
            HostedZoneId: targetHostedZoneId,
            EvaluateTargetHealth: false
          }
        }
      ]
    });
  }

  private createRoute53RecordInCurrentAccount(
    props: NhcResultsStackProps,
    constructName: string,
    domainName: string,
    apiDomain: string,
    target: RecordTarget
  ): void {
    const hostedZone = HostedZone.fromHostedZoneAttributes(
      this,
      `${constructName}-hosted-zone`,
      {
        hostedZoneId: props.envVariables.aws.hostedZoneId,
        zoneName: domainName
      }
    );

    new ARecord(this, `${constructName}-alias`, {
      recordName: apiDomain,
      zone: hostedZone,
      target
    });
  }

  private createAutoGpOnboardingLambda(
    lambdaFactory: NhcLambdaFactory,
    props: NhcResultsStackProps
  ): NhcLambdaFunction {
    const snsKmsKey = this.lookupKmsKeyByAlias(
      props.envVariables.security.snsKmsKeyAliasName
    );

    const gpOnboardingTopicArn = Fn.importValue(NhcTopic.GP_ONBOARDING);
    const gpOnboardingTopic = Topic.fromTopicArn(
      this,
      'gpOnboardingTopic',
      gpOnboardingTopicArn
    );

    const onboardingLambda = lambdaFactory.createLambda({
      name: 'auto-gp-onboarding-lambda',
      environment: {
        ENV_NAME: props.envVariables.common.envName,
        GET_ACTIVE_USER_LAMBDA_ARN: this.getActiveUserLambda.functionArn,
        GP_ONBOARDING_SNS_TOPIC_ARN: gpOnboardingTopicArn,
        ENABLE_GP_ONBOARDING_NOTIFICATIONS:
          props.envVariables.enableGpOnboardingNotifications.toString()
      },
      alarmConfig: {
        createLambdaNotInvokedAlarm: true,
        createLambdaNotInvokedAlarmPeriod: cdk.Duration.hours(25)
      }
    });

    props.odsCodeTable.grantReadWriteData(onboardingLambda);

    // Grant permission to invoke the getActiveUser lambda
    this.getActiveUserLambda.grantInvoke(onboardingLambda);
    gpOnboardingTopic.grantPublish(onboardingLambda);

    onboardingLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey*'],
        resources: [
          `arn:aws:kms:eu-west-2:${this.account}:key/${snsKmsKey.keyId}`
        ]
      })
    );

    // Attach DynamoDB Stream as trigger for INSERT events
    onboardingLambda.addEventSource(
      new DynamoEventSource(props.odsCodeTable, {
        startingPosition: StartingPosition.LATEST,
        batchSize: 5,
        retryAttempts: 2,
        enabled: true,
        filters: [
          FilterCriteria.filter({
            eventName: FilterRule.isEqual('INSERT')
          })
        ]
      })
    );

    // Add scheduled rule to run daily at midnight
    new Rule(this, 'auto-gp-onboarding-schedule-rule', {
      schedule: Schedule.expression('cron(1 0 * * ? *)'), // 00:00:01 UTC every day
      targets: [new LambdaFunction(onboardingLambda)]
    });

    return onboardingLambda;
  }
}
