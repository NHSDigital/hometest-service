import { RemovalPolicy } from 'aws-cdk-lib';
import type { NotifyRoutingPlanIdMap } from '../../shared';

export const initializeEnvVariables = function (
  envName: string
): NHCEnvVariables {
  return {
    auth: {
      cookieSigningPrivateKeysSecretName:
        process.env.AUTH_COOKIE_SIGNING_PRIVATE_KEYS_SECRET_NAME ?? '',
      cookieSigningPublicKeysSecretName:
        process.env.AUTH_COOKIE_SIGNING_PUBLIC_KEYS_SECRET_NAME ?? '',
      cookieSigningKeyId: process.env.AUTH_COOKIE_SIGNING_KID ?? '',
      cookieSameSite: process.env.AUTH_COOKIE_SAME_SITE ?? '',
      sessionMaxDurationMinutes:
        process.env.AUTH_SESSION_MAX_DURATION_MINUTES ?? '',
      accessTokenExpiryDurationMinutes:
        process.env.AUTH_ACCESS_TOKEN_EXPIRY_DURATION_MINUTES ?? '',
      refreshTokenExpiryDurationMinutes:
        process.env.AUTH_REFRESH_TOKEN_EXPIRY_DURATION_MINUTES ?? ''
    },
    aws: {
      hostedZoneId: process.env.AWS_HOSTED_ZONE_ID ?? '',
      cloudfrontHostedZoneId: process.env.AWS_CLOUDFRONT_HOSTED_ZONE_ID ?? '',
      cloudfrontCertificateArn:
        process.env.AWS_CLOUDFRONT_CERTIFICATE_ARN ?? '',
      cloudfrontDomainName: process.env.AWS_CLOUDFRONT_DOMAIN_NAME ?? '',
      backendApiGatewayCertificateArn:
        process.env.AWS_BACKEND_API_GATEWAY_CERTIFICATE_ARN ?? '',
      backendApiDomainName: process.env.AWS_BACKEND_API_DOMAIN_NAME ?? '',
      callbackGatewayCertificateArn:
        process.env.AWS_CALLBACK_API_CERTIFICATE_ARN ?? '',
      callbackApiDomainName: process.env.AWS_CALLBACK_API_DOMAIN_NAME ?? '',
      resultsApiGatewayCertificateArn:
        process.env.AWS_RESULTS_API_GATEWAY_CERTIFICATE_ARN ?? '',
      resultsApiDomainName: process.env.AWS_RESULTS_API_DOMAIN_NAME ?? '',
      resultsMtlsApiDomainName:
        process.env.AWS_MTLS_RESULTS_API_DOMAIN_NAME ?? '',
      mtlsResultsApiGatewayCertificateArn:
        process.env.AWS_MTLS_RESULTS_API_GATEWAY_CERTIFICATE_ARN ?? '',
      authDomainCertificateArn:
        process.env.AWS_AUTH_DOMAIN_CERTIFICATE_ARN ?? '',
      managementAccountRoute53RoleName:
        process.env.MANAGEMENT_ACCOUNT_ROUTE53_ROLE_NAME ?? '',
      managementAccountId: process.env.MANAGEMENT_ACCOUNT_ID ?? '',
      createRoute53RecordsInManagementAccount:
        process.env.AWS_CREATE_ROUTE53_RECORDS_IN_MANAGEMENT_ACCOUNT === 'true',
      removalPolicy:
        RemovalPolicy[
          process.env.AWS_RESOURCES_REMOVAL_POLICY as keyof typeof RemovalPolicy
        ] ?? RemovalPolicy.RETAIN,
      accessLoggingBucketName: process.env.ACCESS_LOGGING_BUCKET_NAME ?? ''
    },
    common: {
      envName
    },
    db: {
      townsendTableName:
        process.env.TOWNSEND_TABLE_NAME ??
        process.env.DB_ENVIRONMENT + '-nhc-townsend-dev-db'
    },
    security: {
      cookieAccessControlAllowOrigin:
        process.env.COOKIE_ACCESS_CONTROL_ALLOW_ORIGIN ?? '',
      snsKmsKeyAliasName: process.env.SNS_KMS_KEY_ALIAS_NAME ?? '',
      kmsKeyId: process.env.KMS_KEY_ID ?? ''
    },
    vpc: {
      name: process.env.VPC_NAME ?? '',
      id: process.env.VPC_ID ?? '',
      subnetIds: JSON.parse(process.env.VPC_SUBNET_IDS ?? ''),
      securityGroups: JSON.parse(process.env.VPC_SECURITY_GROUPS ?? '')
    },
    emis: {
      transactionApiUri: process.env.EMIS_API_URL ?? '',
      machineName: process.env.EMIS_MACHINE_NAME ?? '',
      privateKeySecretName: process.env.EMIS_PRIVATE_KEY_SECRET_NAME ?? '',
      publicCertSecretName: process.env.EMIS_PUBLIC_CERT_SECRET_NAME ?? '',
      certificateCommonName: process.env.EMIS_PAYLOAD_AUDIT_IDENTITY_ID ?? '',
      commonPayloadConfig: {
        from: process.env.EMIS_PAYLOAD_FROM ?? '',
        replyTo: process.env.EMIS_PAYLOAD_REPLY_TO ?? '',
        itkNs: process.env.EMIS_PAYLOAD_ITK_NS ?? '',
        senderAddress: process.env.EMIS_PAYLOAD_SENDER_ADDRESS ?? '',
        itkGuid: process.env.EMIS_PAYLOAD_ITK_GUID ?? '',
        auditIdentityId: process.env.EMIS_PAYLOAD_AUDIT_IDENTITY_ID ?? '',
        odsOverride: process.env.EMIS_PAYLOAD_ODS_OVERRIDE ?? '',
        emisHscnDns: JSON.parse(process.env.EMIS_HSCN_DNS ?? '')
      },
      fileRecordPayloadConfig: {
        method: process.env.EMIS_FILE_RECORD_PAYLOAD_METHOD ?? '',
        methodApi: process.env.EMIS_FILE_RECORD_PAYLOAD_METHOD_API ?? '',
        methodApiVersion:
          process.env.EMIS_FILE_RECORD_PAYLOAD_METHOD_API_VERSION ?? '',
        locationRefId:
          process.env.EMIS_FILE_RECORD_PAYLOAD_LOCATION_REF_ID ?? '',
        locationGuid: process.env.EMIS_FILE_RECORD_PAYLOAD_LOCATION_GUID ?? '',
        locationName: process.env.EMIS_FILE_RECORD_PAYLOAD_LOCATION_NAME ?? '',
        locationTypeId:
          process.env.EMIS_FILE_RECORD_PAYLOAD_LOCATION_TYPE_ID ?? '',
        locationType: process.env.EMIS_FILE_RECORD_PAYLOAD_LOCATION_TYPE ?? '',
        locationTypeGuid:
          process.env.EMIS_FILE_RECORD_PAYLOAD_LOCATION_TYPE_GUID ?? '',
        locationTypeDescription:
          process.env.EMIS_FILE_RECORD_PAYLOAD_LOCATION_TYPE_DESCRIPTION ?? '',
        eventType: parseInt(
          process.env.EMIS_FILE_RECORD_PAYLOAD_EVENT_TYPE ?? '5'
        ),
        isAbnormal: process.env.EMIS_FILE_RECORD_PAYLOAD_IS_ABNORMAL === 'true'
      },
      getActiveUsersPayloadConfig: {
        method: process.env.EMIS_GET_USERS_PAYLOAD_METHOD ?? '',
        methodApi: process.env.EMIS_GET_USERS_PAYLOAD_METHOD_API ?? '',
        methodApiVersion:
          process.env.EMIS_GET_USERS_PAYLOAD_METHOD_API_VERSION ?? ''
      }
    },
    labOrder: {
      thriva: {
        authApiUrl: process.env.THRIVA_AUTH_API_URL ?? '',
        apiUrl: process.env.THRIVA_API_URL ?? '',
        audienceUrl: process.env.THRIVA_AUDIENCE_URL ?? '',
        secretKeySecretName: process.env.THRIVA_SECRET_KEY_SECRET_NAME ?? '',
        clientIdSecretName: process.env.THRIVA_CLIENT_ID_SECRET_NAME ?? ''
      }
    },
    riskCalculation: {
      apiKeySecretName: process.env.RISK_API_KEY_SECRET_NAME ?? '',
      baseApiUrl: process.env.RISK_API_BASE_URL ?? ''
    },
    osPlaces: {
      apiUrl: process.env.OS_PLACES_API_URL ?? '',
      apiKeyName: process.env.OS_PLACES_API_KEY_NAME ?? ''
    },
    login: {
      nhsLoginBaseEndpointUrl: process.env.NHS_LOGIN_BASE_ENDPOINT_URL ?? '',
      nhsLoginClientId: process.env.NHS_LOGIN_CLIENT_ID ?? '',
      nhsLoginRedirectUri: process.env.NHS_LOGIN_REDIRECT_URL ?? '',
      nhsLoginPrivateKeySecretName:
        process.env.NHS_LOGIN_PRIVATE_KEY_SECRET_NAME ?? ''
    },
    nhsApiPlatform: {
      applicationIdSecretName:
        process.env.NHS_API_PLATFORM_APPLICATION_ID_SECRET_NAME ?? '',
      baseUrl: process.env.NHS_API_PLATFORM_BASE_URL ?? '',
      apiKeySecretName: process.env.NHS_API_PLATFORM_API_KEY_SECRET_NAME ?? '',
      privateKeySecretName:
        process.env.NHS_API_PLATFORM_PRIVATE_KEY_SECRET_NAME ?? '',
      keyId: process.env.NHS_API_PLATFORM_KEY_ID ?? ''
    },
    notify: {
      routingPlanIdMap: JSON.parse(
        process.env.NOTIFY_ROUTING_PLAN_ID_MAP ?? '{}'
      ) as NotifyRoutingPlanIdMap,
      jwtExpirationTimeSeconds:
        process.env.NOTIFY_JWT_EXPIRATION_TIME_SECONDS ?? '',
      dbCommunicationLogsTtlDays:
        process.env.NOTIFY_DB_COMMUNICATION_LOGS_TTL_DAYS ?? '',
      callbackApiKeySecretName:
        process.env.NOTIFY_CALLBACK_API_KEY_SECRET_NAME ?? '',
      callbackApiKeyId: process.env.NOTIFY_CALLBACK_API_KEY_ID ?? ''
    },
    gpNotificationSMTP: {
      host: process.env.GP_NOTIFICATION_SMTP_HOST ?? '',
      port: process.env.GP_NOTIFICATION_SMTP_PORT ?? '',
      usernameSecretName:
        process.env.GP_NOTIFICATION_SMTP_USERNAME_SECRET_NAME ?? '',
      passwordSecretName:
        process.env.GP_NOTIFICATION_SMTP_PASSWORD_SECRET_NAME ?? '',
      enableSendCustomHeader:
        process.env.GP_NOTIFICATION_SMTP_ENABLE_SEND_CUSTOM_HEADER ?? 'false'
    },
    resultsAPI: {
      mtlsEndpointEnabled: process.env.MTLS_RESULTS_API_ENABLED === 'true'
    },
    mns: {
      eventsLambdaDeliveryRole:
        process.env.MNS_EVENTS_LAMBDA_DELIVERY_ROLE ?? '',
      jwtExpirationTimeSeconds:
        process.env.MNS_JWT_EXPIRATION_TIME_SECONDS ?? ''
    },
    nudges: {
      config: [
        {
          schedule: process.env.NUDGE_INITIAL_AFTER_START_SCHEDULE ?? '',
          template: process.env.NUDGE_INITIAL_AFTER_START_TEMPLATE ?? ''
        }
      ],
      nudgeInitialAfterStartNumberOfDays: parseInt(
        process.env.NUDGE_INITIAL_AFTER_START_CRITERIA_NUMBER_OF_DAYS ?? '5'
      )
    },
    rumCloudwatchLogsEnabled:
      process.env.RUM_CLOUDWATCH_LOGS_ENABLED === 'true',
    healthCheckMinimumAge: process.env.HEALTH_CHECK_MINIMUM_AGE ?? '',
    healthCheckMaximumAge: process.env.HEALTH_CHECK_MAXIMUM_AGE ?? '',
    addressTextInputMaxLength:
      process.env.ADDRESS_TEXT_INPUT_MAX_LENGTH ?? '35',
    nhcVersion: process.env.NHC_VERSION ?? '',
    healthCheckDataModelVersion:
      process.env.HEALTH_CHECK_DATA_MODEL_VERSION ?? '',
    appId: process.env.APP_ID ?? '',
    dbEnvironment: process.env.DB_ENVIRONMENT ?? '',
    envType: process.env.ENV_TYPE ?? '',
    currentTermsVersion: process.env.CURRENT_TERMS_VERSION ?? '',
    enableAutoExpiry: process.env.ENABLE_AUTO_EXPIRY === 'true',
    enableReportingDataCopy: process.env.ENABLE_REPORTING_DATA_COPY === 'true',
    enableEvaluatorExport: process.env.ENABLE_EVALUATOR_EXPORT === 'true',
    enableReportingExternalIntegrations:
      process.env.ENABLE_REPORTING_EXTERNAL_INTEGRATIONS === 'true',
    autoExpireAfterDays: process.env.AUTO_EXPIRE_AFTER_DAYS ?? '28',
    noLabResultAutoWritebackAfterDays:
      process.env.NO_LAB_RESULT_AUTO_WRITEBACK_AFTER_DAYS ?? '28',
    noLabResultAutoExpireAfterDays:
      process.env.NO_LAB_RESULT_AUTO_EXPIRE_AFTER_DAYS ?? '90',
    noLabResultFinalAutoExpireAfterDays:
      process.env.NO_LAB_RESULT_FINAL_AUTO_EXPIRE_AFTER_DAYS ?? '365',
    logLevel: process.env.LOG_LEVEL ?? '',
    logRetention: parseInt(process.env.LOG_RETENTION_IN_DAYS ?? '90'),
    gpUpdateScheduleIntervalInHours:
      process.env.GP_UPDATE_SCHEDULE_INTERVAL_IN_HOURS ?? '1',
    sqsMaxReceiveCount: process.env.SQS_MAX_RECEIVE_COUNT ?? '3',
    dlqRedriveConfig: {
      autoRedriveEnabled:
        process.env.DLQ_REDRIVE_AUTO_REDRIVE_ENABLED === 'true',
      maxRetriesDefault: process.env.DLQ_REDRIVE_MAX_RETRIES_DEFAULT ?? '14',
      maxRetriesLabOrderQueue:
        process.env.DLQ_REDRIVE_MAX_RETRIES_LAB_ORDER_QUEUE ??
        process.env.DLQ_REDRIVE_MAX_RETRIES_DEFAULT ??
        '14'
    },
    enableNhsNumberCheck: process.env.ENABLE_NHS_NUMBER_CHECK === 'true',
    alarmsEnabled: process.env.ALARMS_ENABLED === 'true',
    csocLogForwardingEnabled:
      process.env.CSOC_LOG_FORWARDING_ENABLED === 'true',
    csocEventBusArn: process.env.CSOC_EVENT_BUS_ARN ?? '',
    imdScoresEnabled: process.env.IMD_SCORES_ENABLED === 'true',
    tracingEnabled: process.env.TRACING_ENABLED === 'true',
    amazonInspectorEnabled: process.env.AMAZON_INSPECTOR_ENABLED === 'true',
    enableGpOnboardingNotifications:
      process.env.ENABLE_GP_ONBOARDING_NOTIFICATIONS === 'true',
    reportingEc2Config: {
      reportingEc2AmiId: process.env.REPORTING_EC2_AMI_ID ?? '',
      instanceStartSchedule: process.env.REPORTING_INSTANCE_START_SCHEDULE,
      instanceStopSchedule: process.env.REPORTING_INSTANCE_STOP_SCHEDULE,
      keyPairName: process.env.REPORTING_INSTANCE_KEY_PAIR_NAME ?? ''
    },
    nhcJwksSecretName: process.env.NHC_JWKS_SECRET_NAME ?? '',
    evaluatorExportConfig: {
      fileRetentionDays: parseInt(
        process.env.EVALUATOR_EXPORT_FILE_RETENTION_DAYS ?? '7'
      ),
      rowLimit: parseInt(process.env.EVALUATOR_EXPORT_ROW_LIMIT ?? '100000'),
      deleteServerAfterDays: parseInt(
        process.env.EVALUATOR_EXPORT_DELETE_SERVER_AFTER_DAYS ?? '7'
      )
    },
    executeApiEndpointEnabled:
      process.env.EXECUTE_API_ENDPOINT_ENABLED === 'true',
    enableNudges: process.env.ENABLE_NUDGES === 'true'
  };
};

interface CommonPayloadConfig {
  from: string;
  replyTo: string;
  itkNs: string;
  senderAddress: string;
  itkGuid: string;
  auditIdentityId: string;
  odsOverride: string | undefined;
  emisHscnDns: string[];
}

interface FileRecordPayloadConfig {
  method: string;
  methodApi: string;
  methodApiVersion: string;
  locationRefId: string;
  locationGuid: string;
  locationName: string;
  locationTypeId: string;
  locationType: string;
  locationTypeGuid: string;
  locationTypeDescription: string;
  eventType: number;
  isAbnormal: boolean;
}

interface GetActiveUsersPayloadConfig {
  method: string;
  methodApi: string;
  methodApiVersion: string;
}

interface DlqRedriveConfig {
  autoRedriveEnabled: boolean;
  maxRetriesDefault: string;
  maxRetriesLabOrderQueue: string;
}

interface ReportingEc2Config {
  reportingEc2AmiId: string;
  instanceStartSchedule?: string;
  instanceStopSchedule?: string;
  keyPairName: string;
}

interface EvaluatorExportConfig {
  fileRetentionDays: number;
  rowLimit: number;
  deleteServerAfterDays: number;
}

interface NudgeConfig {
  schedule: string;
  template: string;
}

export interface NHCEnvVariables {
  auth: {
    cookieSigningPrivateKeysSecretName: string;
    cookieSigningPublicKeysSecretName: string;
    cookieSigningKeyId: string;
    cookieSameSite: string;
    sessionMaxDurationMinutes: string;
    accessTokenExpiryDurationMinutes: string;
    refreshTokenExpiryDurationMinutes: string;
  };
  aws: {
    hostedZoneId: string;
    cloudfrontHostedZoneId: string;
    cloudfrontCertificateArn: string;
    cloudfrontDomainName: string;
    backendApiGatewayCertificateArn: string;
    backendApiDomainName: string;
    resultsApiGatewayCertificateArn: string;
    resultsApiDomainName: string;
    resultsMtlsApiDomainName: string;
    mtlsResultsApiGatewayCertificateArn: string;
    callbackGatewayCertificateArn: string;
    callbackApiDomainName: string;
    authDomainCertificateArn: string;
    managementAccountRoute53RoleName: string;
    managementAccountId: string;
    createRoute53RecordsInManagementAccount: boolean;
    removalPolicy: RemovalPolicy;
    accessLoggingBucketName: string;
  };
  common: {
    envName: string;
  };
  db: {
    townsendTableName: string;
  };
  security: {
    cookieAccessControlAllowOrigin: string;
    snsKmsKeyAliasName: string;
    kmsKeyId: string;
  };
  vpc: {
    name: string;
    id: string;
    subnetIds: string[];
    securityGroups: string[];
  };
  emis: {
    transactionApiUri: string;
    machineName: string;
    privateKeySecretName: string;
    publicCertSecretName: string;
    certificateCommonName: string;
    commonPayloadConfig: CommonPayloadConfig;
    fileRecordPayloadConfig: FileRecordPayloadConfig;
    getActiveUsersPayloadConfig: GetActiveUsersPayloadConfig;
  };
  labOrder: {
    thriva: {
      authApiUrl: string;
      apiUrl: string;
      audienceUrl: string;
      secretKeySecretName: string;
      clientIdSecretName: string;
    };
  };
  riskCalculation: {
    apiKeySecretName: string;
    baseApiUrl: string;
  };
  osPlaces: {
    apiUrl: string;
    apiKeyName: string;
  };
  login: {
    nhsLoginBaseEndpointUrl: string;
    nhsLoginClientId: string;
    nhsLoginRedirectUri: string;
    nhsLoginPrivateKeySecretName: string;
  };
  nhsApiPlatform: {
    baseUrl: string;
    apiKeySecretName: string;
    privateKeySecretName: string;
    keyId: string;
    applicationIdSecretName: string;
  };
  notify: {
    routingPlanIdMap: NotifyRoutingPlanIdMap;
    jwtExpirationTimeSeconds: string;
    dbCommunicationLogsTtlDays: string;
    callbackApiKeySecretName: string;
    callbackApiKeyId: string;
  };
  gpNotificationSMTP: {
    host: string;
    port: string;
    usernameSecretName: string;
    passwordSecretName: string;
    enableSendCustomHeader: string;
  };
  resultsAPI: {
    mtlsEndpointEnabled: boolean;
  };
  mns: {
    eventsLambdaDeliveryRole: string;
    jwtExpirationTimeSeconds: string;
  };
  nudges: {
    config: NudgeConfig[];
    nudgeInitialAfterStartNumberOfDays: number;
  };
  rumCloudwatchLogsEnabled: boolean;
  healthCheckMinimumAge: string;
  healthCheckMaximumAge: string;
  addressTextInputMaxLength: string;
  nhcVersion: string;
  healthCheckDataModelVersion: string;
  appId: string;
  dbEnvironment: string;
  envType: string;
  currentTermsVersion: string;
  enableAutoExpiry: boolean;
  enableReportingDataCopy: boolean;
  enableEvaluatorExport: boolean;
  enableReportingExternalIntegrations: boolean;
  enableGpOnboardingNotifications: boolean;
  autoExpireAfterDays: string;
  noLabResultAutoWritebackAfterDays: string;
  noLabResultAutoExpireAfterDays: string;
  noLabResultFinalAutoExpireAfterDays: string;
  logLevel: string;
  logRetention: number;
  gpUpdateScheduleIntervalInHours: string;
  sqsMaxReceiveCount: string;
  dlqRedriveConfig: DlqRedriveConfig;
  enableNhsNumberCheck: boolean;
  alarmsEnabled: boolean;
  imdScoresEnabled: boolean;
  tracingEnabled: boolean;
  amazonInspectorEnabled: boolean;
  reportingEc2Config: ReportingEc2Config;
  nhcJwksSecretName: string;
  evaluatorExportConfig: EvaluatorExportConfig;
  csocLogForwardingEnabled: boolean;
  csocEventBusArn: string;
  executeApiEndpointEnabled: boolean;
  enableNudges: boolean;
}
