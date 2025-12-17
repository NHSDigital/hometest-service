import { RemovalPolicy } from 'aws-cdk-lib';

export const initializeEnvVariables = function (
  envName: string
): NHCEnvVariables {
  return {
    common: {
      envName
    },
    aws: { managementAccountId: process.env.MANAGEMENT_ACCOUNT_ID ?? '' },
    executeApiEndpointEnabled:
      process.env.EXECUTE_API_ENDPOINT_ENABLED === 'true',
    logRetention: parseInt(process.env.LOG_RETENTION_IN_DAYS ?? '90'),
    awsResourcesRemovalPolicy:
      RemovalPolicy[
        process.env.AWS_RESOURCES_REMOVAL_POLICY as keyof typeof RemovalPolicy
      ] ?? RemovalPolicy.RETAIN,
    accessLoggingBucketName: process.env.ACCESS_LOGGING_BUCKET_NAME ?? '',
    testScenarioFolder: process.env.TEST_SCENARIO_FOLDER_NAME ?? '',
    addressTextInputMaxLength: process.env.ADDRESS_TEXT_INPUT_MAX_LENGTH ?? '',
    vpc: {
      name: process.env.VPC_NAME ?? '',
      id: process.env.VPC_ID ?? '',
      subnetIds: JSON.parse(process.env.VPC_SUBNET_IDS ?? ''),
      securityGroups: JSON.parse(process.env.VPC_SECURITY_GROUPS ?? '')
    },
    envType: process.env.ENV_TYPE ?? '',
    security: {
      kmsKeyId: process.env.KMS_KEY_ID ?? ''
    },
    alarmsEnabled: process.env.ALARMS_ENABLED === 'true',
    nhcVersion: process.env.NHC_VERSION ?? ''
  };
};

export interface NHCEnvVariables {
  common: {
    envName: string;
  };
  aws: { managementAccountId: string };
  executeApiEndpointEnabled: boolean;
  logRetention: number;
  awsResourcesRemovalPolicy: RemovalPolicy;
  accessLoggingBucketName: string;
  testScenarioFolder: string;
  addressTextInputMaxLength: string;
  vpc: {
    name: string;
    id: string;
    subnetIds: string[];
    securityGroups: string[];
  };
  envType: string;
  security: {
    kmsKeyId: string;
  };
  alarmsEnabled: boolean;
  nhcVersion: string;
}
