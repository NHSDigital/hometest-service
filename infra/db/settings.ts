import { RemovalPolicy } from 'aws-cdk-lib';

export const initializeEnvVariables = function (
  envName: string
): NHCEnvVariables {
  return {
    common: {
      envName
    },
    addressTextInputMaxLength: process.env.ADDRESS_TEXT_INPUT_MAX_LENGTH ?? '',
    vpc: {
      name: process.env.VPC_NAME ?? '',
      id: process.env.VPC_ID ?? '',
      subnetIds: JSON.parse(process.env.VPC_SUBNET_IDS ?? ''),
      securityGroups: JSON.parse(process.env.VPC_SECURITY_GROUPS ?? '')
    },
    aws: {
      managementAccountId: process.env.MANAGEMENT_ACCOUNT_ID ?? '',
      removalPolicy:
        RemovalPolicy[
          process.env.AWS_RESOURCES_REMOVAL_POLICY as keyof typeof RemovalPolicy
        ] ?? RemovalPolicy.RETAIN
    },
    accessLoggingBucketName: process.env.ACCESS_LOGGING_BUCKET_NAME ?? '',
    logRetention: parseInt(process.env.LOG_RETENTION_IN_DAYS ?? '90'),
    nhcVersion: process.env.NHC_VERSION ?? '',
    envType: process.env.ENV_TYPE ?? '',
    security: {
      kmsKeyId: process.env.KMS_KEY_ID ?? ''
    },
    pointInTimeRecoveryEnabled:
      process.env.POINT_IN_TIME_RECOVERY_ENABLED === 'true',
    alarmsEnabled: process.env.ALARMS_ENABLED === 'true',
    tracingEnabled: process.env.TRACING_ENABLED === 'true',
    amazonInspectorEnabled: process.env.AMAZON_INSPECTOR_ENABLED === 'true',
    tableDeletionProtectionEnabled:
      process.env.TABLE_DELETION_PROTECTION_ENABLED === 'true'
  };
};

export interface NHCEnvVariables {
  common: {
    envName: string;
  };
  vpc: {
    name: string;
    id: string;
    subnetIds: string[];
    securityGroups: string[];
  };
  aws: {
    managementAccountId: string;
    removalPolicy: RemovalPolicy;
  };
  logRetention: number;
  accessLoggingBucketName: string;
  addressTextInputMaxLength: string;
  alarmsEnabled: boolean;
  nhcVersion: string;
  envType: string;
  security: {
    kmsKeyId: string;
  };
  pointInTimeRecoveryEnabled: boolean;
  tracingEnabled: boolean;
  amazonInspectorEnabled: boolean;
  tableDeletionProtectionEnabled: boolean;
}
