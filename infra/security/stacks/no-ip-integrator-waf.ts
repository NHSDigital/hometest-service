import { WAFClassType } from '../WAFClassType';
import { BaseWAFStack } from './base-waf-stack';
import type { NhcWAFProps } from './common/NHC-WAF-Props';
import { WAFResourceScope } from './common/WAF-Resource-Scope';
import type { Construct } from 'constructs';
import {
  type NhcSharedStackProps,
  SharedBaseStack
} from './common/shared-Base-Stack';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export class NhcNoIPIntegratorWafStack extends SharedBaseStack {
  public noIPIntegratorWAFARN: string;

  constructor(
    scope: Construct,
    id: string,
    props: NhcSharedStackProps,
    version: string
  ) {
    super(scope, id, props.envVariables.common.envName, version, props);
    const noIPIntegratorWafProps: NhcWAFProps = {
      wafName: 'NoIPIntegratorWAFv1',
      wafScope: WAFResourceScope.Regional,
      wafType: WAFClassType.noIPiWAF,
      wafRegion: props.env?.region ?? this.region,
      CFNOutputIdent: 'NoIPIntegratorAPIGWWafv1',
      CFNOutputDesc:
        'WAF to cover API Gateways dedicated to Callback third-party connections',
      logGroupRetention: RetentionDays.ONE_WEEK
    };

    this.noIPIntegratorWAFARN = new BaseWAFStack(
      this,
      id,
      props,
      noIPIntegratorWafProps,
      version,
      false
    ).wafacl.attrArn;
  }
}
