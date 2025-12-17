import { RemovalPolicy, ArnFormat, aws_logs as logs, Stack } from 'aws-cdk-lib';
import { CfnLoggingConfiguration } from 'aws-cdk-lib/aws-wafv2';
import { LogGroup, type RetentionDays } from 'aws-cdk-lib/aws-logs';
import {
  CompositePrincipal,
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal
} from 'aws-cdk-lib/aws-iam';
import {
  type SharedBaseStack,
  translateRegionToCSOCDestinationArn
} from './shared-Base-Stack';
import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { type WAFClassType } from '../../WAFClassType';
import { type IKey } from 'aws-cdk-lib/aws-kms';
import { getKmsKeyById } from '../../../common/lib/utils';
import { AWSAccountNumbers } from '../../../../shared';

export interface LogGroupProps {
  baseStack: SharedBaseStack;
  WAF: wafv2.CfnWebACL;
  WAFType: WAFClassType;
  region: string;
  AccountNumber: string | undefined;
  version: string;
  managementAccountNumber: string | undefined;
  kmsKeyId: string | undefined;
  kmsCloudFrontRegionKeyId: string | undefined;
  logGroupRetention: RetentionDays;
}

export class LogGroupConfiguration {
  constructor(props: LogGroupProps) {
    const keyIdToUse =
      props.region === 'us-east-1'
        ? props.kmsCloudFrontRegionKeyId
        : props.kmsKeyId;
    const kmsKey: IKey = getKmsKeyById(
      props.baseStack,
      `${props.baseStack.stackBaseName}-kms-key-from-id`,
      props.region,
      props.managementAccountNumber ?? '',
      keyIdToUse ?? ''
    );

    // Create Log group
    const aclLogGroup = new LogGroup(props.baseStack, 'webACLLogs', {
      logGroupName: `aws-waf-logs-${props.WAFType}-${props.region}-${props.version}`,
      retention: props.logGroupRetention,
      removalPolicy: RemovalPolicy.DESTROY,
      encryptionKey: kmsKey
    });

    // Create logging configuration with log group as destination
    new CfnLoggingConfiguration(props.baseStack, 'webAclLoggingConfiguration', {
      logDestinationConfigs: [
        // Construct the different ARN format from the logGroupName
        Stack.of(props.baseStack).formatArn({
          arnFormat: ArnFormat.COLON_RESOURCE_NAME,
          service: 'logs',
          resource: 'log-group',
          resourceName: aclLogGroup.logGroupName
        })
      ],
      resourceArn: props.WAF.attrArn
    });

    new logs.CfnSubscriptionFilter(props.baseStack, 'MyCfnSubscriptionFilter', {
      destinationArn: translateAccountNumberToDestinationARN(
        props.AccountNumber,
        props.region
      ),
      filterPattern: '',
      logGroupName: aclLogGroup.logGroupName
    });

    // Create a role for WAF to write logs
    const webACLLogsRole = new Role(props.baseStack, 'webACLLogsCsocRole', {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal(`logs.${props.region}.amazonaws.com`),
        new ServicePrincipal('logs.us-east-1.amazonaws.com')
      ),
      roleName: `aws-waf-logs-csoc-role-${props.WAFType}-${props.region}-${props.version}`
    });
    webACLLogsRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['logs:PutSubscriptionFilter'],
        resources: [
          translateRegionToCSOCDestinationArn(props.region),
          aclLogGroup.logGroupArn
        ]
      })
    );

    // Forward logs to CSOC destination if the account number matches prod
    if (props.AccountNumber === AWSAccountNumbers.PROD) {
      new logs.CfnSubscriptionFilter(
        props.baseStack,
        'CSOCSubscriptionFilter',
        {
          destinationArn: translateRegionToCSOCDestinationArn(props.region),
          filterPattern: '',
          logGroupName: aclLogGroup.logGroupName,
          roleArn: webACLLogsRole.roleArn,
          filterName: 'central_waf_logs'
        }
      );
    }
  }
}

const translateAccountNumberToDestinationARN = function (
  accountNumber: string | undefined,
  region: string | undefined
): string {
  switch (accountNumber) {
    case AWSAccountNumbers.POC:
      return `arn:aws:logs:${region}:637423623484:destination:securityFirehoseDestination-poc`;
    case AWSAccountNumbers.INT:
      return `arn:aws:logs:${region}:637423623484:destination:securityFirehoseDestination-int`;
    case AWSAccountNumbers.TEST:
      return `arn:aws:logs:${region}:637423623484:destination:securityFirehoseDestination-test`;
    case AWSAccountNumbers.PROD:
      return `arn:aws:logs:${region}:637423623484:destination:securityFirehoseDestination-prod`;
    default:
      throw new ReferenceError(
        `Account ID: ${accountNumber} not defined in rule-configs-per-account function`
      );
  }
};
