import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { type Construct } from 'constructs';
import * as WafRules from './Non-Prod-Rules';
import { WAFResourceScope } from '../../WAF-Resource-Scope';
import {
  RATE_LIMIT_EVAL_TIME_SECONDS,
  RATE_LIMIT_REQUEST_LIMIT,
  REQUEST_BODY_SIZE_LIMIT_BYTES
} from '../shared-rules';

export function makeRegionalNonProductionWAFRules(
  scope: Construct,
  region: string
): wafv2.CfnWebACL.RuleProperty[] {
  return [
    WafRules.getBadInputsRule(1),
    WafRules.getCoreRuleSet(2),
    WafRules.getBotControlRule(3),
    WafRules.getRateLimitRule(
      4,
      RATE_LIMIT_REQUEST_LIMIT,
      RATE_LIMIT_EVAL_TIME_SECONDS
    ),
    WafRules.getRequestBodySizeLimitRule(5, REQUEST_BODY_SIZE_LIMIT_BYTES),
    WafRules.getIpBlockRule(6, region, WAFResourceScope.Regional, scope),
    WafRules.getIpBlockRuleGH(7, region, WAFResourceScope.Regional, scope)
  ];
}
