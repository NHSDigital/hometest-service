//  References:
//  https://gist.github.com/statik/f1ac9d6227d98d30c7a7cec0c83f4e64
//  https://github.com/aws-samples/aws-cdk-examples/blob/main/typescript/waf/waf-cloudfront.ts

import { type Construct } from 'constructs';
import {
  SharedBaseStack,
  type NhcSharedStackProps
} from './common/shared-Base-Stack';
import { type NhcWAFProps } from './common/NHC-WAF-Props';
import { WAFResourceScope } from './common/WAF-Resource-Scope';
import { WAFClassType } from '../WAFClassType';
import { BaseWAFStack } from './base-waf-stack';
import { type NhcGlobalWafStack } from './global-waf-stack';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export class NhcRegionalWafStack extends SharedBaseStack {
  public regionalWAFARN: string;

  constructor(
    scope: Construct,
    id: string,
    props: NhcSharedStackProps,
    globalWaf: NhcGlobalWafStack,
    version: string
  ) {
    super(scope, id, props.envVariables.common.envName, version, props);
    const wafProps: NhcWAFProps = {
      wafName: 'NHCRegionalWAFv5',
      wafScope: WAFResourceScope.Regional,
      wafType: WAFClassType.rWAF,
      wafRegion: props.env?.region ? props.env.region : this.region,
      CFNOutputIdent: 'RegionalAPIGWWafv5',
      CFNOutputDesc: 'WAF to cover APIGateways that are citizen facing',
      logGroupRetention: RetentionDays.ONE_WEEK
    };
    this.regionalWAFARN = new BaseWAFStack(
      this,
      id,
      props,
      wafProps,
      version
    ).wafacl.attrArn;

    new ssm.StringParameter(this, wafProps.CFNOutputIdent, {
      parameterName: `GlobalCFDWafARNv5`,
      stringValue: globalWaf.GlobalWAFARN
    });
  }
}
