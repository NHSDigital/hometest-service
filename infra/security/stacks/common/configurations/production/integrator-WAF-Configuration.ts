import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { type Construct } from 'constructs';
import * as WafRules from './Production-Rules';
import { WAFResourceScope } from '../../WAF-Resource-Scope';
import {
  RATE_LIMIT_EVAL_TIME_SECONDS,
  RATE_LIMIT_REQUEST_LIMIT
} from '../shared-rules';

export function makeIntegratorProductionWAFRules(
  scope: Construct,
  region: string,
  includeIpAllowlist: boolean = true
): wafv2.CfnWebACL.RuleProperty[] {
  const rules: wafv2.CfnRuleGroup.RuleProperty[] = [
    WafRules.getBadInputsRule(1),
    WafRules.getCoreRuleSet(2),
    WafRules.getRateLimitRule(
      3,
      RATE_LIMIT_REQUEST_LIMIT,
      RATE_LIMIT_EVAL_TIME_SECONDS
    )
    // WafRules.getBotControlRule(3), - may not be needed
  ];

  if (includeIpAllowlist) {
    rules.push(
      WafRules.getIpBlockThrivaRule(4, region, WAFResourceScope.Regional, scope)
    );
  }

  return rules;
}
