import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { type Construct } from 'constructs';
import * as WafRules from './Prod-Like-Rules';
import { WAFResourceScope } from '../../WAF-Resource-Scope';
import * as SharedWafRules from '../shared-rules';

export function makeCloudFrontProductionLikeWAFRules(
  scope: Construct,
  region: string
): wafv2.CfnWebACL.RuleProperty[] {
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
    ),
    // payload constraint? tbc
    WafRules.getIpBlockRule(6, region, WAFResourceScope.CloudFront, scope),
    WafRules.getIpBlockRuleGH(7, region, WAFResourceScope.CloudFront, scope)
  ];
  console.log(rules);
  return rules;
}
