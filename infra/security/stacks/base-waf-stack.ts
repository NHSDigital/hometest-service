//  References:
//  https://gist.github.com/statik/f1ac9d6227d98d30c7a7cec0c83f4e64
//  https://github.com/aws-samples/aws-cdk-examples/blob/main/typescript/waf/waf-cloudfront.ts

import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { type Construct } from 'constructs';
import {
  SharedBaseStack,
  type NhcSharedStackProps
} from './common/shared-Base-Stack';
import { LogGroupConfiguration } from './common/log-group-class';
import { type NhcWAFProps } from './common/NHC-WAF-Props';
import {
  getDefaultWAFAction,
  getWAFRules
} from './common/rule-configs-per-account';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { WAFClassType } from '../WAFClassType';
import { defaultApiBlockedAction } from './common/default-waf-actions';

export const CUSTOM_API_BLOCKED_RESPONSE_BODY = 'CustomApiBlockedResponseBody';

export class BaseWAFStack extends SharedBaseStack {
  public readonly wafacl: wafv2.CfnWebACL;
  // eslint-disable-next-line max-params
  constructor(
    scope: Construct,
    id: string,
    envProps: NhcSharedStackProps,
    wafProps: NhcWAFProps,
    version: string,
    includeIpAllowlist: boolean = true
  ) {
    super(scope, id, envProps.envVariables.common.envName, version, envProps);

    this.wafacl = new wafv2.CfnWebACL(this, wafProps.wafName + version, {
      name: wafProps.wafName,
      scope: wafProps.wafScope,
      customResponseBodies:
        wafProps.wafType !== WAFClassType.gWAF
          ? {
              CUSTOM_API_BLOCKED_RESPONSE_BODY: {
                content: JSON.stringify({
                  message:
                    'Your request has been blocked by the WAF, please try again later or contact support.',
                  status: (
                    defaultApiBlockedAction.customResponse as wafv2.CfnWebACL.CustomResponseProperty
                  ).responseCode
                }),
                contentType: 'APPLICATION_JSON'
              }
            }
          : undefined,
      defaultAction: getDefaultWAFAction(
        process.env.CDK_DEFAULT_ACCOUNT,
        wafProps.wafType
      ),
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: wafProps.wafName,
        sampledRequestsEnabled: true
      },
      rules: getWAFRules(
        this,
        wafProps.wafRegion,
        process.env.CDK_DEFAULT_ACCOUNT,
        wafProps.wafType,
        includeIpAllowlist
      )
    });

    new LogGroupConfiguration({
      baseStack: this,
      WAF: this.wafacl,
      WAFType: wafProps.wafType,
      region: wafProps.wafRegion,
      AccountNumber: process.env.CDK_DEFAULT_ACCOUNT,
      version: version,
      managementAccountNumber: envProps.envVariables.aws.managementAccountId,
      kmsKeyId: envProps.envVariables.security.kmsKeyId,
      kmsCloudFrontRegionKeyId:
        envProps.envVariables.security.kmsCloudFrontRegionKeyId,
      logGroupRetention: wafProps.logGroupRetention
    });

    new ssm.StringParameter(this, wafProps.CFNOutputIdent, {
      parameterName: `${wafProps.CFNOutputIdent}ARN`,
      stringValue: this.wafacl.attrArn
    });
  }
}
