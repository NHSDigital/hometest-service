import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { type Construct } from 'constructs';

interface RulesListType {
  name: string;
  priority: number;
  overrideAction: string;
  excludedRules: string[];
}

export function makeProductionWAFRules(
  scope: Construct,
  listOfRules: RulesListType[] = []
): wafv2.CfnWebACL.RuleProperty[] {
  const rules: wafv2.CfnRuleGroup.RuleProperty[] = [];
  return rules;
}
