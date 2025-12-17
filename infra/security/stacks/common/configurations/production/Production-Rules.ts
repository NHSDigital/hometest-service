import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { type WAFResourceScope } from '../../WAF-Resource-Scope'; // move files
import { type Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';

// Bad Inputs Rule (Block Mode)
export const getBadInputsRule = function (
  priority: number
): wafv2.CfnWebACL.RuleProperty {
  return {
    name: 'AWSManagedRulesKnownBadInputsRuleSet',
    priority,
    overrideAction: { none: {} },
    statement: {
      managedRuleGroupStatement: {
        vendorName: 'AWS',
        name: 'AWSManagedRulesKnownBadInputsRuleSet'
      }
    },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      metricName: 'KnownBadInputsRuleSet',
      sampledRequestsEnabled: true
    }
  };
};

// Common / core ruleset
export const getCoreRuleSet = function (
  priority: number
): wafv2.CfnWebACL.RuleProperty {
  return {
    name: 'AWSManagedRulesCommonRuleSet',
    priority,
    overrideAction: { none: {} },
    statement: {
      managedRuleGroupStatement: {
        vendorName: 'AWS',
        name: 'AWSManagedRulesCommonRuleSet'
      }
    },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      metricName: 'AWSManagedRulesCommonRuleSet',
      sampledRequestsEnabled: true
    }
  };
};

export const getIpBlockThrivaRule = function (
  priority: number,
  region: string,
  wafResourceScope: WAFResourceScope,
  scope: Construct
): wafv2.CfnWebACL.RuleProperty {
  return {
    name: 'IpBlockThrivaRule',
    priority,
    action: {
      allow: {}
    },
    statement: {
      ipSetReferenceStatement: {
        arn: ssm.StringParameter.fromStringParameterName(
          scope,
          `IPList-Thriva-${region}-${wafResourceScope}v5ARN`,
          `IPList-Thriva-${region}-${wafResourceScope}v5ARN`
        ).stringValue
      }
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: 'IPBlockRule'
    }
  };
};

export const getBotControlRule = function (
  priority: number
): wafv2.CfnWebACL.RuleProperty {
  return {
    name: 'AWS-AWSManagedRulesBotControlRuleSet',
    priority,
    overrideAction: { none: {} },
    statement: {
      managedRuleGroupStatement: {
        name: 'AWSManagedRulesBotControlRuleSet',
        vendorName: 'AWS'
      }
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: 'botControlRule'
    }
  };
};

export const getRateLimitRule = function (
  priority: number,
  rateLimitRequestlimit: number,
  rateLimitEvalTimeSeconds: number
): wafv2.CfnWebACL.RuleProperty {
  return {
    name: 'rateLimitRule',
    priority,
    statement: {
      rateBasedStatement: {
        limit: rateLimitRequestlimit,
        evaluationWindowSec: rateLimitEvalTimeSeconds,
        aggregateKeyType: 'IP'
      }
    },
    action: {
      block: {}
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: 'rateLimitRule'
    }
  };
};

export const getRequestBodySizeLimitRule = function (
  priority: number,
  sizeLimitBytes: number
): wafv2.CfnWebACL.RuleProperty {
  return {
    name: 'requestBodySizeLimitRule',
    priority,
    statement: {
      sizeConstraintStatement: {
        fieldToMatch: {
          body: {
            oversizeHandling: 'CONTINUE'
          }
        },
        comparisonOperator: 'GE',
        size: sizeLimitBytes,
        textTransformations: [{ priority: 0, type: 'NONE' }]
      }
    },
    action: { block: {} },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: 'requestBodySizeLimitRule'
    }
  };
};
