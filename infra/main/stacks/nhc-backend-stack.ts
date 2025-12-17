import { type Construct } from 'constructs';
import {
  BaseStack,
  addEnvPrefixToPhysicalId,
  translateRegionToCSOCDestinationArn,
  ApiGatewayCustomLogFormat
} from '../../common/base-stack';
import { type NhcLambdaFunction } from '../../common/nhc-lambda-function';
import { type ITable } from 'aws-cdk-lib/aws-dynamodb';
import { CfnOutput, type StackProps } from 'aws-cdk-lib';
import { MethodLoggingLevel, RestApi } from 'aws-cdk-lib/aws-apigateway';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import type * as sqs from 'aws-cdk-lib/aws-sqs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import {
  type ILogGroup,
  LogGroup,
  MetricFilter,
  RetentionDays,
  CfnSubscriptionFilter
} from 'aws-cdk-lib/aws-logs';
import { type NHCEnvVariables } from '../settings';
import { ResourceNamingService } from '../../common/resource-naming-service';
import {
  type ICertificate,
  Certificate
} from 'aws-cdk-lib/aws-certificatemanager';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGateway } from 'aws-cdk-lib/aws-route53-targets';
import { CfnWebACLAssociation } from 'aws-cdk-lib/aws-wafv2';
import * as cdk from 'aws-cdk-lib';
import { CrossAccountRoute53RecordSet } from 'cdk-cross-account-route53';
import {
  CompositePrincipal,
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal
} from 'aws-cdk-lib/aws-iam';
import { type CfnIdentityPool } from 'aws-cdk-lib/aws-cognito';
import { NhcLambdaFactory } from '../../common/nhc-lambda-factory';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { NhcBucketFactory } from '../../common/nhc-bucket-factory';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import { EnvType } from '../../common/lib/enums';
import { TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { type NhsAlarmFactory } from '../../common/nhc-alarm-factory';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { type IKey } from 'aws-cdk-lib/aws-kms';

interface NhcBackendStackProps extends StackProps {
  patientTable: ITable;
  healthCheckTable: ITable;
  gpUpdateSchedulerTable: ITable;
  orderTable: ITable;
  gpOdsCodeTable: ITable;
  sessionTable: ITable;
  townsendScoreTable: ITable;
  postcodeLsoaTable: ITable;
  lsoaImdTable: ITable;
  communicationLogTable: ITable;
  auditEventsQueue: sqs.Queue;
  labOrderQueue: sqs.Queue;
  appMonitorIdentityPool: CfnIdentityPool;
  envVariables: NHCEnvVariables;
  alarmFactory: NhsAlarmFactory;
}

export class NhcBackendStack extends BaseStack {
  private readonly custom4xxErrorsMetricName = '4XXError_Excluding_401_403_404';
  private readonly customHealthCheckApiMetricNamespace;
  private readonly metricFilter4xxErrors: MetricFilter | undefined;
  private readonly stageName: string;
  private readonly namingService: ResourceNamingService;
  private readonly patientCommunicationFailuresMetric: cloudwatch.Metric;
  private readonly kmsKey: IKey;
  eventAuditLambdaLogGroup: ILogGroup;
  healthCheckInitLambdaLogGroup: ILogGroup;
  loginCallbackLambdaLogGroup: ILogGroup;
  apiLogGroup: LogGroup;

  constructor(scope: Construct, id: string, props: NhcBackendStackProps) {
    super(
      scope,
      id,
      props.envVariables.common.envName,
      props.envVariables.nhcVersion
    );
    this.stageName = 'dev';

    this.namingService = new ResourceNamingService(
      props.envVariables.common.envName
    );

    const lambdaFactory = new NhcLambdaFactory(
      this,
      this.stackBaseName,
      props.envVariables,
      props.alarmFactory,
      props.envVariables.tracingEnabled,
      props.envVariables.amazonInspectorEnabled
    );

    this.customHealthCheckApiMetricNamespace = `${this.envName} Health Check API metrics`;
    this.kmsKey = this.getKmsKeyById(
      props.envVariables.aws.managementAccountId,
      props.envVariables.security.kmsKeyId
    );

    const selectedCohortBucket = this.createSelectedCohortBucket(props);

    const customMetrics = this.createCustomMetrics(props);
    this.patientCommunicationFailuresMetric =
      customMetrics.patientCommunicationFailuresMetric;

    const {
      healthCheckVersionMigrationLambda,
      getHealthCheckLambda,
      getHealthChecksLambda,
      updateQuestionnaireLambda,
      submitQuestionnaireLambda,
      initiateHealthCheckLambda,
      addressLookupLambda,
      loginCallbackLambda,
      refreshTokenLambda,
      logoutLambda,
      eventAuditLambda,
      getPatientInfoLambda,
      updatePatientInfoLambda,
      updateBloodTestLambda,
      gpUpdateSchedulerLambda,
      rumIdentityLambda,
      notifyCallbacksLambda,
      jwksLambda,
      notifyAuthorizerLambda
    } = this.createLambdaFunctions(props, lambdaFactory, selectedCohortBucket);

    this.apiLogGroup = new LogGroup(this, 'health-check-api-gateway-logs', {
      logGroupName: this.namingService.getEnvSpecificResourceName(
        'health-check-api-gateway-logs'
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
        roleName: `${this.namingService.getEnvSpecificResourceName('health-check-api-gateway-logs')}-csoc-role`
      });
      apiGatewayCSOCLogsRole.addToPolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['logs:PutSubscriptionFilter'],
          resources: [
            translateRegionToCSOCDestinationArn(this.region),
            this.apiLogGroup.logGroupArn
          ]
        })
      );
      new CfnSubscriptionFilter(this, 'CSOCSubscriptionFilter', {
        destinationArn: translateRegionToCSOCDestinationArn(this.region),
        filterPattern: '',
        logGroupName: this.apiLogGroup.logGroupName,
        roleArn: apiGatewayCSOCLogsRole.roleArn,
        filterName: 'central_waf_logs'
      });
    }

    const domainName = props.envVariables.aws.cloudfrontDomainName;
    const apiDomain = props.envVariables.aws.backendApiDomainName;

    const cert = Certificate.fromCertificateArn(
      this,
      'test-nhc-cert',
      props.envVariables.aws.backendApiGatewayCertificateArn
    );

    const apiName = addEnvPrefixToPhysicalId(this.envName, 'health-check-api');

    const api = new RestApi(this, 'health-check-api', {
      cloudWatchRole: false,
      restApiName: apiName,
      disableExecuteApiEndpoint: !props.envVariables.executeApiEndpointEnabled,
      description: 'health check api gateway',
      deployOptions: {
        stageName: this.stageName,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          this.apiLogGroup
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
        'health-check-api-gateway-logs-metric-filter-4xx',
        {
          logGroup: this.apiLogGroup,
          filterPattern: {
            logPatternString: `{ $.status = %400|402|40[5-9]|41[0-9]|42[0-9]% }`
          },
          metricNamespace: this.customHealthCheckApiMetricNamespace,
          metricName: this.custom4xxErrorsMetricName,
          metricValue: '1',
          dimensions: {
            'Resource path': '$.resourcePath',
            'HTTP method': '$.httpMethod'
          }
        }
      );
    }

    new CfnWebACLAssociation(this, 'BackendAPIGWRegionalWafAssociation', {
      resourceArn: api.deploymentStage.stageArn,
      webAclArn: ssm.StringParameter.fromStringParameterName(
        this,
        'wafARNBackendStack',
        'RegionalAPIGWWafv5ARN'
      ).stringValue
    });

    const addressLookupEndpoint = api.root.addResource('address');
    addressLookupEndpoint.addMethod(
      'GET',
      new apigateway.LambdaIntegration(addressLookupLambda)
    );
    this.createEndpointAlarms(
      api,
      'GET',
      '/address',
      this.stageName,
      props.alarmFactory
    );

    const healthCheckRootPath = api.root.addResource('health-checks');
    healthCheckRootPath.addMethod(
      'POST',
      new apigateway.LambdaIntegration(initiateHealthCheckLambda)
    );

    this.createEndpointAlarms(
      api,
      'POST',
      '/health-checks',
      this.stageName,
      props.alarmFactory
    );

    healthCheckRootPath.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getHealthChecksLambda)
    );
    this.addCorsOptions(
      healthCheckRootPath,
      props.envVariables.security.cookieAccessControlAllowOrigin
    );
    this.createEndpointAlarms(
      api,
      'GET',
      '/health-checks',
      this.stageName,
      props.alarmFactory
    );

    const singleItem = healthCheckRootPath.addResource('{id}');
    singleItem.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getHealthCheckLambda)
    );
    this.addCorsOptions(
      singleItem,
      props.envVariables.security.cookieAccessControlAllowOrigin
    );
    this.createEndpointAlarms(
      api,
      'GET',
      '/health-checks/{id}',
      this.stageName,
      props.alarmFactory
    );

    const healthCheckVersion = singleItem.addResource('version');

    healthCheckVersion.addMethod(
      'POST',
      new apigateway.LambdaIntegration(healthCheckVersionMigrationLambda)
    );

    this.addCorsOptions(
      healthCheckVersion,
      props.envVariables.security.cookieAccessControlAllowOrigin
    );

    this.createEndpointAlarms(
      api,
      'POST',
      '/health-checks/{id}/version',
      this.stageName,
      props.alarmFactory
    );

    const scheduleGpUpdateEndpoint =
      singleItem.addResource('schedule-gp-update');
    scheduleGpUpdateEndpoint.addMethod(
      'POST',
      new apigateway.LambdaIntegration(gpUpdateSchedulerLambda)
    );
    this.addCorsOptions(
      scheduleGpUpdateEndpoint,
      props.envVariables.security.cookieAccessControlAllowOrigin
    );
    this.createEndpointAlarms(
      api,
      'POST',
      '/health-checks/{id}/schedule-gp-update',
      this.stageName,
      props.alarmFactory
    );

    const questionnaireItem = singleItem.addResource('questionnaire');
    questionnaireItem.addMethod(
      'POST',
      new apigateway.LambdaIntegration(updateQuestionnaireLambda)
    );
    this.addCorsOptions(
      questionnaireItem,
      props.envVariables.security.cookieAccessControlAllowOrigin
    );
    this.createEndpointAlarms(
      api,
      'POST',
      '/health-checks/{id}/questionnaire',
      this.stageName,
      props.alarmFactory
    );

    const submitQuestionnaireItem = questionnaireItem.addResource('submit');
    submitQuestionnaireItem.addMethod(
      'POST',
      new apigateway.LambdaIntegration(submitQuestionnaireLambda)
    );
    this.addCorsOptions(
      submitQuestionnaireItem,
      props.envVariables.security.cookieAccessControlAllowOrigin
    );
    this.createEndpointAlarms(
      api,
      'POST',
      '/health-checks/{id}/questionnaire/submit',
      this.stageName,
      props.alarmFactory
    );

    this.prepareBloodTestEndpoint(singleItem, updateBloodTestLambda, props);

    const patientEndpoint = api.root.addResource('patient');
    patientEndpoint.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getPatientInfoLambda)
    );
    this.createEndpointAlarms(
      api,
      'GET',
      '/patient',
      this.stageName,
      props.alarmFactory
    );
    patientEndpoint.addMethod(
      'POST',
      new apigateway.LambdaIntegration(updatePatientInfoLambda)
    );
    this.createEndpointAlarms(
      api,
      'POST',
      '/patient',
      this.stageName,
      props.alarmFactory
    );
    this.addCorsOptions(
      patientEndpoint,
      props.envVariables.security.cookieAccessControlAllowOrigin
    );

    const loginEndpoint = api.root.addResource('login');
    loginEndpoint.addMethod(
      'POST',
      new apigateway.LambdaIntegration(loginCallbackLambda)
    );
    this.addCorsOptions(
      loginEndpoint,
      props.envVariables.security.cookieAccessControlAllowOrigin
    );
    this.createEndpointAlarms(
      api,
      'POST',
      '/login',
      this.stageName,
      props.alarmFactory
    );

    const refreshTokenEndpoint = api.root.addResource('refresh-token');
    refreshTokenEndpoint.addMethod(
      'POST',
      new apigateway.LambdaIntegration(refreshTokenLambda)
    );
    this.addCorsOptions(
      refreshTokenEndpoint,
      props.envVariables.security.cookieAccessControlAllowOrigin
    );
    this.createEndpointAlarms(
      api,
      'POST',
      '/refresh-token',
      this.stageName,
      props.alarmFactory
    );

    const logoutEndpoint = api.root.addResource('logout');
    logoutEndpoint.addMethod(
      'POST',
      new apigateway.LambdaIntegration(logoutLambda)
    );
    this.addCorsOptions(
      logoutEndpoint,
      props.envVariables.security.cookieAccessControlAllowOrigin
    );
    this.createEndpointAlarms(
      api,
      'POST',
      '/logout',
      this.stageName,
      props.alarmFactory
    );

    const eventAuditRootPath = api.root.addResource('events');
    eventAuditRootPath.addMethod(
      'POST',
      new apigateway.LambdaIntegration(eventAuditLambda)
    );
    this.addCorsOptions(
      eventAuditRootPath,
      props.envVariables.security.cookieAccessControlAllowOrigin
    );
    this.createEndpointAlarms(
      api,
      'POST',
      '/events',
      this.stageName,
      props.alarmFactory
    );

    const rumIdentityEndpoint = api.root.addResource('rum-identity');
    rumIdentityEndpoint.addMethod(
      'GET',
      new apigateway.LambdaIntegration(rumIdentityLambda)
    );
    this.addCorsOptions(
      rumIdentityEndpoint,
      props.envVariables.security.cookieAccessControlAllowOrigin
    );
    this.createEndpointAlarms(
      api,
      'GET',
      '/rum-identity',
      this.stageName,
      props.alarmFactory
    );

    const jwksRootPath = api.root.addResource('.well-known');
    const jwksPath = jwksRootPath.addResource('jwks.json');
    jwksPath.addMethod('GET', new apigateway.LambdaIntegration(jwksLambda));

    const callbackCert = Certificate.fromCertificateArn(
      this,
      'nhc-cert-notify-callback',
      props.envVariables.aws.callbackGatewayCertificateArn
    );

    const callbackApiDomainName = props.envVariables.aws.callbackApiDomainName;

    const callbackApi = this.createCallbackApi(
      props,
      callbackCert,
      callbackApiDomainName,
      notifyCallbacksLambda,
      notifyAuthorizerLambda
    );

    new CfnOutput(this, 'HealthCheckApiBaseUrl', {
      value: api.url
    });

    new CfnOutput(this, 'CallbacksApiBaseUrl', {
      value: callbackApi.url
    });

    if (props.envVariables.aws.createRoute53RecordsInManagementAccount) {
      this.createRoute53RecordInManagementAccount(
        props.envVariables,
        apiDomain,
        '',
        api
      );
      this.createRoute53RecordInManagementAccount(
        props.envVariables,
        callbackApiDomainName,
        'callback-api',
        callbackApi
      );
    } else {
      this.createRoute53RecordInCurrentAccount(
        props,
        domainName,
        apiDomain,
        '',
        api
      );
      this.createRoute53RecordInCurrentAccount(
        props,
        domainName,
        callbackApiDomainName,
        'callback-api',
        callbackApi
      );
    }
  }

  private createRoute53RecordInManagementAccount(
    envVariables: NHCEnvVariables,
    apiDomain: string,
    componentId: string,
    api: RestApi
  ): void {
    let recordSetId =
      componentId === '' ? 'api-dns-record' : `${componentId}-api-dns-record`;

    new CrossAccountRoute53RecordSet(this, recordSetId, {
      delegationRoleName: envVariables.aws.managementAccountRoute53RoleName,
      delegationRoleAccount: envVariables.aws.managementAccountId,
      hostedZoneId: envVariables.aws.hostedZoneId,
      resourceRecordSets: [
        {
          Name: apiDomain,
          Type: 'A',
          AliasTarget: {
            DNSName: api.domainName?.domainNameAliasDomainName,
            HostedZoneId: api.domainName?.domainNameAliasHostedZoneId,
            EvaluateTargetHealth: false
          }
        }
      ]
    });
  }

  private createRoute53RecordInCurrentAccount(
    props: NhcBackendStackProps,
    domainName: string,
    apiDomain: string,
    componentId: string,
    api: RestApi
  ): void {
    const hostedZone = HostedZone.fromHostedZoneAttributes(
      this,
      `${componentId}-hosted-zone`,
      {
        hostedZoneId: props.envVariables.aws.hostedZoneId,
        zoneName: domainName
      }
    );

    new ARecord(this, `${componentId}Alias`, {
      recordName: apiDomain,
      zone: hostedZone,
      target: RecordTarget.fromAlias(new ApiGateway(api))
    });
  }

  createLambdaFunctions(
    props: NhcBackendStackProps,
    lambdaFactory: NhcLambdaFactory,
    selectedCohortBucket: s3.Bucket
  ): Record<string, NhcLambdaFunction> {
    const getHealthCheckLambda = lambdaFactory.createLambda({
      name: 'health-check-get-lambda',
      environment: {
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId
      }
    });
    props.healthCheckTable.grantReadData(getHealthCheckLambda);
    props.sessionTable.grantReadData(getHealthCheckLambda);

    const getHealthChecksLambda = lambdaFactory.createLambda({
      name: 'health-checks-get-lambda',
      environment: {
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId
      }
    });

    props.healthCheckTable.grantReadData(getHealthChecksLambda);
    props.sessionTable.grantReadData(getHealthChecksLambda);

    const updateQuestionnaireLambda = lambdaFactory.createLambda({
      name: 'health-check-questionnaire-update-lambda',
      environment: {
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl,
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId,
        IMD_SCORES_ENABLED: props.envVariables.imdScoresEnabled.toString(),
        TOWNSEND_TABLE_NAME: props.envVariables.db.townsendTableName
      }
    });

    props.healthCheckTable.grantReadWriteData(updateQuestionnaireLambda);
    props.sessionTable.grantReadData(updateQuestionnaireLambda);
    props.patientTable.grantReadData(updateQuestionnaireLambda);
    props.townsendScoreTable.grantReadData(updateQuestionnaireLambda);
    props.auditEventsQueue.grantSendMessages(updateQuestionnaireLambda);
    props.postcodeLsoaTable.grantReadData(updateQuestionnaireLambda);
    props.lsoaImdTable.grantReadData(updateQuestionnaireLambda);

    const healthCheckVersionMigrationLambda = lambdaFactory.createLambda({
      name: 'health-check-version-migration-lambda',
      environment: {
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl,
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId,
        HEALTH_CHECK_DATA_MODEL_VERSION:
          props.envVariables.healthCheckDataModelVersion
      }
    });

    props.healthCheckTable.grantReadWriteData(
      healthCheckVersionMigrationLambda
    );
    props.sessionTable.grantReadData(healthCheckVersionMigrationLambda);
    props.patientTable.grantReadData(healthCheckVersionMigrationLambda);
    props.auditEventsQueue.grantSendMessages(healthCheckVersionMigrationLambda);

    props.healthCheckTable.grantReadWriteData(
      healthCheckVersionMigrationLambda
    );
    props.sessionTable.grantReadData(healthCheckVersionMigrationLambda);
    props.patientTable.grantReadData(healthCheckVersionMigrationLambda);
    props.auditEventsQueue.grantSendMessages(healthCheckVersionMigrationLambda);

    const submitQuestionnaireLambda = lambdaFactory.createLambda({
      name: 'health-check-questionnaire-submit-lambda',
      environment: {
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId
      }
    });

    props.healthCheckTable.grantReadWriteData(submitQuestionnaireLambda);
    props.sessionTable.grantReadData(submitQuestionnaireLambda);

    const updateBloodTestLambda = this.createUpdateBloodTestLambda(
      props,
      lambdaFactory
    );

    const initiateHealthCheckLambda = lambdaFactory.createLambda({
      name: 'health-check-initiate-lambda',
      environment: {
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl,
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId,
        NHS_LOGIN_BASE_ENDPOINT_URL:
          props.envVariables.login.nhsLoginBaseEndpointUrl,
        NHS_LOGIN_CLIENT_ID: props.envVariables.login.nhsLoginClientId,
        NHS_LOGIN_REDIRECT_URL: props.envVariables.login.nhsLoginRedirectUri,
        NHS_LOGIN_PRIVATE_KEY_SECRET_NAME:
          props.envVariables.login.nhsLoginPrivateKeySecretName,
        CURRENT_TERMS_VERSION: props.envVariables.currentTermsVersion,
        HEALTH_CHECK_DATA_MODEL_VERSION:
          props.envVariables.healthCheckDataModelVersion
      }
    });
    this.healthCheckInitLambdaLogGroup = initiateHealthCheckLambda.logGroup;

    props.healthCheckTable.grantReadWriteData(initiateHealthCheckLambda);
    props.sessionTable.grantReadData(initiateHealthCheckLambda);
    props.patientTable.grantReadWriteData(initiateHealthCheckLambda);
    props.auditEventsQueue.grantSendMessages(initiateHealthCheckLambda);

    const gpUpdateSchedulerLambda = lambdaFactory.createLambda({
      name: 'gp-update-scheduler-lambda',
      environment: {
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId
      }
    });

    props.gpUpdateSchedulerTable.grantReadWriteData(gpUpdateSchedulerLambda);
    props.healthCheckTable.grantReadData(gpUpdateSchedulerLambda);
    props.sessionTable.grantReadData(gpUpdateSchedulerLambda);

    const addressLookupLambda = lambdaFactory.createLambda({
      name: 'address-lookup-lambda',
      additionalProps: { timeout: cdk.Duration.seconds(20) },
      environment: {
        OS_PLACES_API_URL: props.envVariables.osPlaces.apiUrl,
        OS_PLACES_API_KEY_NAME: props.envVariables.osPlaces.apiKeyName,
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId
      }
    });

    props.sessionTable.grantReadData(addressLookupLambda);

    const osPlacesApiKeySecret = Secret.fromSecretNameV2(
      this,
      `os-places-api-key-${props.envVariables.common.envName}`,
      props.envVariables.osPlaces.apiKeyName
    );
    osPlacesApiKeySecret.grantRead(addressLookupLambda);

    const loginCallbackLambda = lambdaFactory.createLambda({
      name: 'login-lambda',
      environment: {
        AUTH_COOKIE_PRIVATE_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPrivateKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId,
        AUTH_COOKIE_SAME_SITE: props.envVariables.auth.cookieSameSite,
        AUTH_SESSION_MAX_DURATION_MINUTES:
          props.envVariables.auth.sessionMaxDurationMinutes,
        NHS_LOGIN_BASE_ENDPOINT_URL:
          props.envVariables.login.nhsLoginBaseEndpointUrl,
        NHS_LOGIN_CLIENT_ID: props.envVariables.login.nhsLoginClientId,
        NHS_LOGIN_REDIRECT_URL: props.envVariables.login.nhsLoginRedirectUri,
        NHS_LOGIN_PRIVATE_KEY_SECRET_NAME:
          props.envVariables.login.nhsLoginPrivateKeySecretName,
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        HEALTH_CHECK_MINIMUM_AGE: props.envVariables.healthCheckMinimumAge,
        HEALTH_CHECK_MAXIMUM_AGE: props.envVariables.healthCheckMaximumAge,
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl,
        COGNITO_IDENTITY_POOL_ID: props.appMonitorIdentityPool.ref,
        COGNITO_IDENTITY_POOL_DEV_PROVIDER_NAME:
          props.appMonitorIdentityPool.developerProviderName ?? '',
        ENABLE_NHS_NUMBER_CHECK: `${props.envVariables.enableNhsNumberCheck}`,
        SELECTED_COHORT_BUCKET_NAME: selectedCohortBucket.bucketName,
        AUTH_ACCESS_TOKEN_EXPIRY_DURATION_MINUTES:
          props.envVariables.auth.accessTokenExpiryDurationMinutes,
        AUTH_REFRESH_TOKEN_EXPIRY_DURATION_MINUTES:
          props.envVariables.auth.refreshTokenExpiryDurationMinutes
      }
    });
    this.loginCallbackLambdaLogGroup = loginCallbackLambda.logGroup;

    selectedCohortBucket.grantRead(loginCallbackLambda);

    loginCallbackLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['cognito-identity:GetOpenIdTokenForDeveloperIdentity'],
        resources: [
          `arn:aws:cognito-identity:${this.region}:${this.account}:identitypool/${props.appMonitorIdentityPool.ref}`
        ]
      })
    );

    const refreshTokenLambda = lambdaFactory.createLambda({
      name: 'refresh-token-lambda',
      environment: {
        AUTH_COOKIE_PRIVATE_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPrivateKeysSecretName,
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId,
        AUTH_COOKIE_SAME_SITE: props.envVariables.auth.cookieSameSite,
        AUTH_SESSION_MAX_DURATION_MINUTES:
          props.envVariables.auth.sessionMaxDurationMinutes,
        AUTH_ACCESS_TOKEN_EXPIRY_DURATION_MINUTES:
          props.envVariables.auth.accessTokenExpiryDurationMinutes,
        AUTH_REFRESH_TOKEN_EXPIRY_DURATION_MINUTES:
          props.envVariables.auth.refreshTokenExpiryDurationMinutes,
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin
      }
    });
    props.sessionTable.grantReadWriteData(refreshTokenLambda);

    const logoutLambda = lambdaFactory.createLambda({
      name: 'logout-lambda',
      environment: {
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId,
        AUTH_COOKIE_SAME_SITE: props.envVariables.auth.cookieSameSite,
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl
      }
    });
    props.sessionTable.grantReadWriteData(logoutLambda);
    props.auditEventsQueue.grantSendMessages(logoutLambda);

    const getPatientInfoLambda = lambdaFactory.createLambda({
      name: 'get-patient-info-lambda',
      environment: {
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId,
        CURRENT_TERMS_VERSION: props.envVariables.currentTermsVersion
      }
    });

    props.patientTable.grantReadData(getPatientInfoLambda);
    props.sessionTable.grantReadData(getPatientInfoLambda);

    const updatePatientInfoLambda = lambdaFactory.createLambda({
      name: 'update-patient-info-lambda',
      environment: {
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl,
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId,
        CURRENT_TERMS_VERSION: props.envVariables.currentTermsVersion
      }
    });

    props.patientTable.grantWriteData(updatePatientInfoLambda);
    props.sessionTable.grantReadData(updatePatientInfoLambda);
    props.auditEventsQueue.grantSendMessages(updatePatientInfoLambda);

    const eventAuditLambda = lambdaFactory.createLambda({
      name: 'event-audit-lambda',
      environment: {
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl,
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId
      }
    });
    this.eventAuditLambdaLogGroup = eventAuditLambda.logGroup;

    props.sessionTable.grantReadData(eventAuditLambda);
    props.auditEventsQueue.grantSendMessages(eventAuditLambda);

    const rumIdentityLambda = lambdaFactory.createLambda({
      name: 'rum-identity-lambda',
      environment: {
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId,
        AUTH_SESSION_MAX_DURATION_MINUTES:
          props.envVariables.auth.sessionMaxDurationMinutes,
        COGNITO_IDENTITY_POOL_ID: props.appMonitorIdentityPool.ref,
        COGNITO_IDENTITY_POOL_DEV_PROVIDER_NAME:
          props.appMonitorIdentityPool.developerProviderName ?? ''
      }
    });

    props.sessionTable.grantReadData(rumIdentityLambda);

    rumIdentityLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['cognito-identity:GetOpenIdTokenForDeveloperIdentity'],
        resources: [
          `arn:aws:cognito-identity:${this.region}:${this.account}:identitypool/${props.appMonitorIdentityPool.ref}`
        ]
      })
    );

    const authKeyPairGeneratorLambda = lambdaFactory.createLambda({
      name: 'auth-keypair-generator-lambda',
      environment: {
        AUTH_COOKIE_SIGNING_PRIVATE_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPrivateKeysSecretName,
        AUTH_COOKIE_SIGNING_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_SIGNING_KID: props.envVariables.auth.cookieSigningKeyId
      }
    });

    const nhcJwks = Secret.fromSecretNameV2(
      this,
      'nhc-jwks-key',
      props.envVariables.nhcJwksSecretName
    );

    const jwksLambda = lambdaFactory.createLambda({
      name: 'jwks-lambda',
      environment: {
        NHC_JWKS_SECRET_NAME: props.envVariables.nhcJwksSecretName
      }
    });

    const nhsLoginPrivateKey = Secret.fromSecretNameV2(
      this,
      'nhs-login-private-key',
      props.envVariables.login.nhsLoginPrivateKeySecretName
    );

    const authCookiePrivateKey = Secret.fromSecretNameV2(
      this,
      'auth-cookie-private-keys',
      props.envVariables.auth.cookieSigningPrivateKeysSecretName
    );

    const authCookiePublicKey = Secret.fromSecretNameV2(
      this,
      'auth-cookie-public-keys',
      props.envVariables.auth.cookieSigningPublicKeysSecretName
    );

    nhcJwks.grantRead(jwksLambda);

    nhsLoginPrivateKey.grantRead(loginCallbackLambda);
    nhsLoginPrivateKey.grantRead(initiateHealthCheckLambda);

    const notifyCallbacksLambda = lambdaFactory.createLambda({
      name: 'notify-callbacks-lambda',
      environment: {
        NOTIFY_CALLBACK_API_KEY_SECRET_NAME:
          props.envVariables.notify.callbackApiKeySecretName,
        NOTIFY_CALLBACK_API_KEY_ID: props.envVariables.notify.callbackApiKeyId,
        NHS_API_PLATFORM_APPLICATION_ID_SECRET_NAME:
          props.envVariables.nhsApiPlatform.applicationIdSecretName,
        PATIENT_COMMUNICATION_FAILURES_METRIC_NAME:
          this.patientCommunicationFailuresMetric.metricName,
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl
      }
    });

    props.communicationLogTable.grantReadWriteData(notifyCallbacksLambda);
    props.patientTable.grantReadData(notifyCallbacksLambda);
    props.healthCheckTable.grantReadData(notifyCallbacksLambda);
    props.auditEventsQueue.grantSendMessages(notifyCallbacksLambda);

    const notifyAuthorizerLambda = lambdaFactory.createLambda({
      name: 'notify-authorizer-lambda',
      environment: {
        NOTIFY_CALLBACK_API_KEY_SECRET_NAME:
          props.envVariables.notify.callbackApiKeySecretName,
        NOTIFY_CALLBACK_API_KEY_ID: props.envVariables.notify.callbackApiKeyId
      }
    });

    const notifyCallbacksApiKey = Secret.fromSecretNameV2(
      this,
      'notify-callbacks-api-key',
      props.envVariables.notify.callbackApiKeySecretName
    );

    const notifyCallbacksApplicationId = Secret.fromSecretNameV2(
      this,
      'notify-callbacks-application-id',
      props.envVariables.nhsApiPlatform.applicationIdSecretName
    );

    notifyCallbacksApiKey.grantRead(notifyCallbacksLambda);
    notifyCallbacksApplicationId.grantRead(notifyCallbacksLambda);
    notifyCallbacksApiKey.grantRead(notifyAuthorizerLambda);
    notifyCallbacksApplicationId.grantRead(notifyAuthorizerLambda);

    const grantAuthCookiePublicKeyReadAccessOnlyToLambdas = [
      eventAuditLambda,
      getHealthCheckLambda,
      updateQuestionnaireLambda,
      initiateHealthCheckLambda,
      getHealthChecksLambda,
      submitQuestionnaireLambda,
      updateBloodTestLambda,
      updatePatientInfoLambda,
      getPatientInfoLambda,
      addressLookupLambda,
      gpUpdateSchedulerLambda,
      logoutLambda,
      healthCheckVersionMigrationLambda,
      rumIdentityLambda
    ];

    const grantAuthCookiePublicAndPrivateKeyReadAccessToLambdas =
      grantAuthCookiePublicKeyReadAccessOnlyToLambdas.concat([
        loginCallbackLambda,
        refreshTokenLambda,
        authKeyPairGeneratorLambda
      ]);

    for (const lambda of grantAuthCookiePublicKeyReadAccessOnlyToLambdas) {
      authCookiePublicKey.grantRead(lambda);
    }

    for (const lambda of grantAuthCookiePublicAndPrivateKeyReadAccessToLambdas) {
      authCookiePublicKey.grantRead(lambda);
      authCookiePrivateKey.grantRead(lambda);
    }

    authCookiePrivateKey.grantWrite(authKeyPairGeneratorLambda);
    authCookiePublicKey.grantWrite(authKeyPairGeneratorLambda);

    props.gpOdsCodeTable.grantReadData(loginCallbackLambda);
    props.sessionTable.grantReadWriteData(loginCallbackLambda);
    props.auditEventsQueue.grantSendMessages(loginCallbackLambda);
    props.healthCheckTable.grantReadWriteData(loginCallbackLambda);
    props.patientTable.grantReadWriteData(loginCallbackLambda);

    return {
      healthCheckVersionMigrationLambda,
      getHealthCheckLambda,
      getHealthChecksLambda,
      updateQuestionnaireLambda,
      submitQuestionnaireLambda,
      initiateHealthCheckLambda,
      addressLookupLambda,
      loginCallbackLambda,
      refreshTokenLambda,
      logoutLambda,
      eventAuditLambda,
      getPatientInfoLambda,
      updatePatientInfoLambda,
      updateBloodTestLambda,
      gpUpdateSchedulerLambda,
      rumIdentityLambda,
      jwksLambda,
      authKeyPairGeneratorLambda,
      notifyCallbacksLambda,
      notifyAuthorizerLambda
    };
  }

  createCallbackApi(
    props: NhcBackendStackProps,
    cert: ICertificate,
    domainName: string,
    lambda: NhcLambdaFunction,
    authorizerLambda: NhcLambdaFunction
  ): RestApi {
    const callbackApiLogGroup = new LogGroup(
      this,
      'callback-api-gateway-logs',
      {
        logGroupName: this.namingService.getEnvSpecificResourceName(
          'callback-api-gateway-logs'
        ),
        removalPolicy: props.envVariables.aws.removalPolicy,
        retention: props.envVariables.logRetention || RetentionDays.INFINITE,
        encryptionKey: this.kmsKey
      }
    );

    const callbackApi = new RestApi(this, 'callback-api', {
      cloudWatchRole: false,
      restApiName: addEnvPrefixToPhysicalId(
        this.envName,
        'callback-api-gateway'
      ),
      disableExecuteApiEndpoint: !props.envVariables.executeApiEndpointEnabled,
      description: 'Callback API Gateway',
      deployOptions: {
        stageName: this.stageName,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          callbackApiLogGroup
        ),
        accessLogFormat: ApiGatewayCustomLogFormat,
        loggingLevel: MethodLoggingLevel.INFO,
        metricsEnabled: props.envVariables.alarmsEnabled,
        tracingEnabled: props.envVariables.tracingEnabled
      },
      domainName: {
        domainName: domainName,
        certificate: cert
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL]
      },
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.CUSTOM
      }
    });

    new CfnWebACLAssociation(this, 'CallbackAPIGWIntegratorWafAssociation', {
      resourceArn: callbackApi.deploymentStage.stageArn,
      webAclArn: ssm.StringParameter.fromStringParameterName(
        this,
        'wafARNCallbackAPIBackendStack',
        'NoIPIntegratorAPIGWWafv1ARN'
      ).stringValue
    });

    const authorizer = new apigateway.RequestAuthorizer(
      this,
      'ApiKeyLambdaAuthorizer',
      {
        handler: authorizerLambda,
        identitySources: [apigateway.IdentitySource.header('x-api-key')]
      }
    );

    const notifyRootPath = callbackApi.root.addResource('notify');
    const notifyCallbacksEndpoint =
      notifyRootPath.addResource('message-status');
    notifyCallbacksEndpoint.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambda),
      { authorizer }
    );
    this.createEndpointAlarms(
      callbackApi,
      'POST',
      '/message-status',
      this.stageName,
      props.alarmFactory
    );

    const patientCommunicationFailureAlarmName =
      'patient-communication-failure';
    props.alarmFactory.create(this, patientCommunicationFailureAlarmName, {
      metric: this.patientCommunicationFailuresMetric,
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription:
        'Alarm triggered when we get informed that Notify could not deliver a message to a patient',
      alarmName: this.namingService.getEnvSpecificResourceName(
        patientCommunicationFailureAlarmName
      )
    });

    return callbackApi;
  }

  createUpdateBloodTestLambda(
    props: NhcBackendStackProps,
    lambdaFactory: NhcLambdaFactory
  ): NhcLambdaFunction {
    const updateBloodTestLambda = lambdaFactory.createLambda({
      name: 'health-check-blood-test-update-lambda',
      environment: {
        EVENTS_QUEUE_URL: props.auditEventsQueue.queueUrl,
        LAB_ORDER_QUEUE_URL: props.labOrderQueue.queueUrl,
        COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN:
          props.envVariables.security.cookieAccessControlAllowOrigin,
        AUTH_COOKIE_PUBLIC_KEYS_SECRET_NAME:
          props.envVariables.auth.cookieSigningPublicKeysSecretName,
        AUTH_COOKIE_KEY_ID: props.envVariables.auth.cookieSigningKeyId,
        ADDRESS_TEXT_INPUT_MAX_LENGTH:
          props.envVariables.addressTextInputMaxLength
      }
    });

    props.auditEventsQueue.grantSendMessages(updateBloodTestLambda);
    props.labOrderQueue.grantSendMessages(updateBloodTestLambda);
    props.healthCheckTable.grantReadWriteData(updateBloodTestLambda);
    props.sessionTable.grantReadData(updateBloodTestLambda);
    props.orderTable.grantWriteData(updateBloodTestLambda);
    props.orderTable.grantReadData(updateBloodTestLambda);
    props.patientTable.grantReadData(updateBloodTestLambda);

    return updateBloodTestLambda;
  }

  prepareBloodTestEndpoint(
    singleItem: apigateway.Resource,
    updateBloodTestLambda: NhcLambdaFunction,
    props: NhcBackendStackProps
  ): void {
    const bloodTestItem = singleItem.addResource('blood-test');
    bloodTestItem.addMethod(
      'POST',
      new apigateway.LambdaIntegration(updateBloodTestLambda)
    );
    this.addCorsOptions(
      bloodTestItem,
      props.envVariables.security.cookieAccessControlAllowOrigin
    );
  }

  createSelectedCohortBucket(props: NhcBackendStackProps): s3.Bucket {
    // S3 bucket for limited cohort phase
    const bucketName = `${this.account}-${this.envName}-nhc-selected-cohort`;
    const bucket = new NhcBucketFactory().create({
      scope: this,
      id: 'nhc-selected-cohort-bucket',
      bucketName,
      accessLoggingBucketName: props.envVariables.aws.accessLoggingBucketName,
      envType: props.envVariables.envType,
      accountNumber: this.account,
      removalPolicy: props.envVariables.aws.removalPolicy,
      additionalProps: {
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: this.kmsKey
      }
    });

    // deploy a whitelist of NHS numbers, only on non-prod envs
    if (props.envVariables.envType !== EnvType.PROD) {
      const managementAccountId = props.envVariables.aws.managementAccountId;

      const bucketDeployment = new s3deploy.BucketDeployment(
        this,
        `${this.envName}-nhc-selected-cohort-deployment`,
        {
          sources: [
            s3deploy.Source.asset(
              path.join(__dirname, './../../../data/selected-cohort-data')
            )
          ],
          destinationBucket: bucket
        }
      );
      bucketDeployment.handlerRole.addToPrincipalPolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['kms:Decrypt', 'kms:GenerateDataKey*'],
          resources: [
            `arn:aws:kms:eu-west-2:${managementAccountId}:key/${props.envVariables.security.kmsKeyId}`
          ]
        })
      );
    }

    return bucket;
  }

  private createCustomMetrics(props: NhcBackendStackProps): {
    patientCommunicationFailuresMetric: cloudwatch.Metric;
  } {
    return {
      patientCommunicationFailuresMetric: new cloudwatch.Metric({
        namespace: 'nhc.backend',
        metricName: `${props.envVariables.common.envName}PatientCommunicationFailures`,
        statistic: cloudwatch.Stats.SUM,
        dimensionsMap: {
          service: 'notify-callbacks'
        }
      })
    };
  }

  private createEndpointAlarms(
    api: RestApi,
    method: string,
    endpoint: string,
    stage: string,
    alarmFactory: NhsAlarmFactory
  ): void {
    this.createApplication4XXEndpointAlarm(
      api.restApiName,
      method,
      endpoint,
      alarmFactory
    );

    this.createEndpointAlarm({
      api,
      method,
      endpoint,
      stage,
      metric: '5XXError',
      alarmFactory
    });
  }

  private createEndpointAlarm(params: {
    api: RestApi;
    method: string;
    endpoint: string;
    stage: string;
    metric: string;
    alarmFactory: NhsAlarmFactory;
  }): void {
    const { api, method, endpoint, stage, metric, alarmFactory } = params;
    alarmFactory.create(
      this,
      `${metric}-${api.restApiName}-${method}-${endpoint}-alarm`,
      {
        metric: api.metric(metric, {
          statistic: cloudwatch.Stats.AVERAGE,
          period: cdk.Duration.hours(3),
          dimensionsMap: {
            Method: method,
            Resource: endpoint,
            Stage: stage,
            ApiName: api.restApiName
          }
        }),
        alarmName: this.namingService.getEnvSpecificResourceName(
          `backend-${method}-${endpoint}-api-${metric}-alarm`
        ),
        threshold: 0.2,
        evaluationPeriods: 1,
        alarmDescription: `Triggers if there are over 20% ${metric} metric hits in the ${method} ${endpoint} API.`,
        treatMissingData: TreatMissingData.NOT_BREACHING,
        actionsEnabled: true
      }
    );
  }

  private createApplication4XXEndpointAlarm(
    apiName: string,
    method: string,
    endpoint: string,
    alarmFactory: NhsAlarmFactory
  ): cloudwatch.Alarm | null {
    if (!this.metricFilter4xxErrors) {
      return null;
    }

    const alarmProps: cloudwatch.AlarmProps = {
      alarmName: `${apiName}-${method}-${endpoint}-Custom4XXErrorAlarm`,
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
        dimensionsMap: {
          'Resource path': endpoint,
          'HTTP method': method
        },
        period: cdk.Duration.hours(3)
      })
    };

    return alarmFactory.create(
      this,
      `${apiName}-${method}-${endpoint}-4xx-exclude-alarm`,
      alarmProps
    );
  }
}
