import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { type Construct } from 'constructs';
import * as WafRules from './Non-Prod-Rules';
import { WAFResourceScope } from '../../WAF-Resource-Scope';
import {
  RATE_LIMIT_EVAL_TIME_SECONDS,
  RATE_LIMIT_REQUEST_LIMIT
} from '../shared-rules';

export function makeIntegratorNonProductionWAFRules(
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
    // payload constraint? tbc
    // For non-dev, specific IPs for integrators to be created
  ];

  if (includeIpAllowlist) {
    rules.push(
      WafRules.getIpBlockRule(4, region, WAFResourceScope.Regional, scope)
    );
    rules.push(
      WafRules.getIpBlockRuleGH(5, region, WAFResourceScope.Regional, scope)
    );
  }

  if (
    process.env.NONPROD_INTEGRATOR_WAF_SECRET &&
    process.env.NONPROD_INTEGRATOR_WAF_SECRET.length > 0
  ) {
    rules.push(
      WafRules.getIntegratorWAFAllowRule(
        process.env.NONPROD_INTEGRATOR_WAF_SECRET,
        6
      )
    );
  } else {
    console.warn(
      'Integrator WAF rule not deployed due to empty or missing process.env.NONPROD_INTEGRATOR_WAF_SECRET'
    );
  }

  return rules;
}
