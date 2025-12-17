import { RemovalPolicy } from 'aws-cdk-lib';
import { AWSAccountNumbers } from '../../shared';

export const initializeEnvVariables = function (): NHCEnvVariables {
  return {
    nhcVersion: process.env.NHC_VERSION ?? '',
    slackChannelConfig: getSlackChannelConfig(process.env.CDK_DEFAULT_ACCOUNT),
    alarmSecurityEmail: process.env.ALARM_SECURITY_EMAIL ?? '',
    security: {
      snsKmsKeyAliasName: process.env.SNS_KMS_KEY_ALIAS_NAME ?? '',
      kmsKeyId: process.env.KMS_KEY_ID ?? ''
    },
    common: {
      envName: 'shared',
      accountName: process.env.ACCOUNT_NAME ?? ''
    },
    vpc: {
      name: process.env.VPC_NAME ?? '',
      id: process.env.VPC_ID ?? '',
      subnetIds: JSON.parse(process.env.VPC_SUBNET_IDS ?? ''),
      securityGroups: JSON.parse(process.env.VPC_SECURITY_GROUPS ?? '')
    },
    aws: {
      managementAccountId: process.env.MANAGEMENT_ACCOUNT_ID ?? '',
      managementAccountRoute53RoleName:
        process.env.MANAGEMENT_ACCOUNT_ROUTE53_ROLE_NAME ?? '',
      hostedZoneId: process.env.AWS_HOSTED_ZONE_ID ?? ''
    },
    mns: {
      eventsLambdaDeliveryRole:
        process.env.MNS_EVENTS_LAMBDA_DELIVERY_ROLE ?? ''
    },
    emailVerificationDomain: process.env.EMAIL_VERIFICATION_DOMAIN ?? '',
    envType: process.env.ENV_TYPE ?? '',
    accessLoggingBucketName: process.env.ACCESS_LOGGING_BUCKET_NAME ?? '',
    awsResourcesRemovalPolicy:
      RemovalPolicy[
        process.env.AWS_RESOURCES_REMOVAL_POLICY as keyof typeof RemovalPolicy
      ] ?? RemovalPolicy.RETAIN
  };
};

interface SlackChannelConfig {
  slackWorkspaceId: string;
  slackChannelId: string;
  gpOnboardingSlackChannelId: string;
}

export interface NHCEnvVariables {
  nhcVersion: string;
  slackChannelConfig: SlackChannelConfig;
  alarmSecurityEmail: string;
  security: {
    snsKmsKeyAliasName: string;
    kmsKeyId: string;
  };
  common: {
    envName: string;
    accountName: string;
  };
  vpc: {
    name: string;
    id: string;
    subnetIds: string[];
    securityGroups: string[];
  };
  aws: {
    managementAccountId: string;
    managementAccountRoute53RoleName: string;
    hostedZoneId: string;
  };
  emailVerificationDomain: string;
  envType: string;
  accessLoggingBucketName: string;
  awsResourcesRemovalPolicy: RemovalPolicy;
  mns: {
    eventsLambdaDeliveryRole: string;
  };
}

const getSlackChannelConfig = function (accountId: any): SlackChannelConfig {
  switch (accountId) {
    case AWSAccountNumbers.POC:
      return {
        slackWorkspaceId: 'TJ00QR03U',
        slackChannelId: 'C08FVRFS1RR',
        gpOnboardingSlackChannelId: 'C09804AUAUS'
      };
    case AWSAccountNumbers.INT:
      return {
        slackWorkspaceId: 'TJ00QR03U',
        slackChannelId: 'C08FVRFS1RR',
        gpOnboardingSlackChannelId: 'C09804AUAUS'
      };
    case AWSAccountNumbers.TEST:
      return {
        slackWorkspaceId: 'TJ00QR03U',
        slackChannelId: 'C08FVRFS1RR',
        gpOnboardingSlackChannelId: 'C09804AUAUS'
      };
    case AWSAccountNumbers.PROD:
      return {
        slackWorkspaceId: 'TJ00QR03U',
        slackChannelId: 'C08EV20T82Z',
        gpOnboardingSlackChannelId: 'C098EBX2GFK'
      };
    default:
      throw new ReferenceError(`Account ID: ${accountId} not found`);
  }
};
