import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { type Construct } from 'constructs';
import * as WafRules from './Prod-Like-Rules';
import * as SharedWafRules from './../shared-rules';
import { WAFResourceScope } from '../../WAF-Resource-Scope';
import {
  RATE_LIMIT_EVAL_TIME_SECONDS,
  RATE_LIMIT_REQUEST_LIMIT,
  REQUEST_BODY_SIZE_LIMIT_BYTES
} from '../shared-rules';
export function makeRegionalProductionLikeWAFRules(
  scope: Construct,
  region: string
): wafv2.CfnWebACL.RuleProperty[] {
  return [
    WafRules.getBadInputsRule(1),
    SharedWafRules.getJWKSAllowRule(2),
    WafRules.getCoreRuleSet(3),
    WafRules.getBotControlRule(4),
    WafRules.getRateLimitRule(
      5,
      RATE_LIMIT_REQUEST_LIMIT,
      RATE_LIMIT_EVAL_TIME_SECONDS
    ),
    WafRules.getRequestBodySizeLimitRule(6, REQUEST_BODY_SIZE_LIMIT_BYTES),
    // payload constraint? tbc
    WafRules.getIpBlockRule(7, region, WAFResourceScope.Regional, scope),
    WafRules.getIpBlockRuleGH(8, region, WAFResourceScope.Regional, scope)
  ];
}
