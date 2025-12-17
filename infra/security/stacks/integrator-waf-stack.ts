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

export class NhcIntegratorWafStack extends SharedBaseStack {
  public integratorWAFARN: string;
  public noIPIntegratorWAFARN: string;

  constructor(
    scope: Construct,
    id: string,
    props: NhcSharedStackProps,
    version: string
  ) {
    super(scope, id, props.envVariables.common.envName, version, props);
    const wafProps: NhcWAFProps = {
      wafName: 'IntegratorWAFv5',
      wafScope: WAFResourceScope.Regional,
      wafType: WAFClassType.iWAF,
      wafRegion: props.env?.region ?? this.region,
      CFNOutputIdent: 'IntegratorAPIGWWafv5',
      CFNOutputDesc:
        'WAF to cover API Gateways dedicated to integrations with trusted third-party connections',
      logGroupRetention: RetentionDays.ONE_WEEK
    };
    this.integratorWAFARN = new BaseWAFStack(
      this,
      id,
      props,
      wafProps,
      version
    ).wafacl.attrArn;
  }
}
