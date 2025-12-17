import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as WafRules from './Production-Rules';
import * as SharedWafRules from './../shared-rules';

export function makeRegionalProductionWAFRules(): wafv2.CfnWebACL.RuleProperty[] {
  return [
    WafRules.getBadInputsRule(1),
    SharedWafRules.getJWKSAllowRule(2),
    WafRules.getCoreRuleSet(3),
    WafRules.getBotControlRule(4),
    WafRules.getRateLimitRule(
      5,
      SharedWafRules.RATE_LIMIT_REQUEST_LIMIT,
      SharedWafRules.RATE_LIMIT_EVAL_TIME_SECONDS
    ),
    WafRules.getRequestBodySizeLimitRule(
      6,
      SharedWafRules.REQUEST_BODY_SIZE_LIMIT_BYTES
    )
  ];
}
