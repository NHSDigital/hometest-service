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
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export class NhcGlobalWafStack extends SharedBaseStack {
  public GlobalWAFARN: string;
  constructor(
    scope: Construct,
    id: string,
    props: NhcSharedStackProps,
    version: string
  ) {
    super(scope, id, props.envVariables.common.envName, version, props);
    const wafProps: NhcWAFProps = {
      wafName: `NHCGlobalWAFv5`,
      wafScope: WAFResourceScope.CloudFront,
      wafType: WAFClassType.gWAF,
      // different between "scope" and "this" causing issues
      wafRegion: props.env?.region ? props.env.region : this.region,
      CFNOutputIdent: 'GlobalCFDWafv5',
      CFNOutputDesc: 'WAF to cover CloudFront Distributions',
      logGroupRetention: RetentionDays.THREE_MONTHS
    };
    this.GlobalWAFARN = new BaseWAFStack(
      this,
      id,
      props,
      wafProps,
      version
    ).wafacl.attrArn;
  }
}
