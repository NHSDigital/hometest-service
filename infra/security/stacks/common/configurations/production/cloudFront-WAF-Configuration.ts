import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as WafRules from './Production-Rules';
import * as SharedWafRules from '../shared-rules';

export function makeCloudFrontProductionWAFRules(): wafv2.CfnWebACL.RuleProperty[] {
  const rules: wafv2.CfnRuleGroup.RuleProperty[] = [
    SharedWafRules.getMainCssAllowRule(0),
    WafRules.getBadInputsRule(1),
    WafRules.getCoreRuleSet(2),
    WafRules.getBotControlRule(3),
    WafRules.getRateLimitRule(
      4,
      SharedWafRules.RATE_LIMIT_REQUEST_LIMIT,
      SharedWafRules.RATE_LIMIT_EVAL_TIME_SECONDS
    ),
    WafRules.getRequestBodySizeLimitRule(
      5,
      SharedWafRules.REQUEST_BODY_SIZE_LIMIT_BYTES
    )
  ];
  console.log(rules);
  return rules;
}
