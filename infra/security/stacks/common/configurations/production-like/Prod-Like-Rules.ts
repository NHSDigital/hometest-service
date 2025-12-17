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
  const badInputsRule: wafv2.CfnWebACL.RuleProperty = {
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
  return badInputsRule;
};

// IP Block Rule
export const getIpBlockRule = function (
  priority: number,
  region: string,
  wafResourceScope: WAFResourceScope,
  scope: Construct
): wafv2.CfnWebACL.RuleProperty {
  const ipBlockRule: wafv2.CfnWebACL.RuleProperty = {
    name: 'IPBlockRule',
    priority,
    action: {
      allow: {}
    },
    statement: {
      ipSetReferenceStatement: {
        arn: ssm.StringParameter.fromStringParameterName(
          scope,
          `IPList-${region}-${wafResourceScope}v5ARN`,
          `IPList-${region}-${wafResourceScope}v5ARN`
        ).stringValue
      }
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: 'IPBlockRule'
    }
  };
  return ipBlockRule;
};

export const getIpBlockThrivaRule = function (
  priority: number,
  region: string,
  wafResourceScope: WAFResourceScope,
  scope: Construct
): wafv2.CfnWebACL.RuleProperty {
  const ipBlockRule: wafv2.CfnWebACL.RuleProperty = {
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
  return ipBlockRule;
};

// IP Block Rule Github Runners
export const getIpBlockRuleGH = function (
  priority: number,
  region: string,
  wafResourceScope: WAFResourceScope,
  scope: Construct
): wafv2.CfnWebACL.RuleProperty {
  const ipBlockRule: wafv2.CfnWebACL.RuleProperty = {
    name: 'IPBlockRuleGH',
    priority,
    action: {
      allow: {}
    },
    statement: {
      ipSetReferenceStatement: {
        arn: ssm.StringParameter.fromStringParameterName(
          scope,
          `IPListGH-${region}-${wafResourceScope}5ARN`,
          `IPListGH-${region}-${wafResourceScope}v5ARN`
        ).stringValue
      }
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: 'IPBlockRuleGH'
    }
  };
  return ipBlockRule;
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
        vendorName: 'AWS',
        ruleActionOverrides: [
          {
            name: 'SignalNonBrowserUserAgent', // To allow Postman requests
            actionToUse: { count: {} }
          }
        ]
      }
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: 'botControlRule'
    }
  };
};

export const getIntegratorWAFAllowRule = function (
  NONPROD_INTEGRATOR_WAF_SECRET: string,
  priority: number
): wafv2.CfnWebACL.RuleProperty {
  const integratorHeaderSecretRule: wafv2.CfnWebACL.RuleProperty = {
    name: 'integratorHeaderSecretRule',
    priority,
    action: {
      allow: {}
    },
    statement: {
      byteMatchStatement: {
        searchString: NONPROD_INTEGRATOR_WAF_SECRET,
        fieldToMatch: {
          singleHeader: {
            Name: 'IntegratorToken'
          }
        },
        textTransformations: [
          {
            priority: 0,
            type: 'NONE'
          }
        ],
        positionalConstraint: 'EXACTLY'
      }
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: 'sectestrule'
    }
  };
  return integratorHeaderSecretRule;
};

export const getRateLimitRule = function (
  priority: number,
  RATE_LIMIT_REQUEST_LIMIT: number,
  RATE_LIMIT_EVAL_TIME_SECONDS: number
): wafv2.CfnWebACL.RuleProperty {
  const rateLimitRule: wafv2.CfnWebACL.RuleProperty = {
    name: 'rateLimitRule',
    priority,
    statement: {
      rateBasedStatement: {
        limit: RATE_LIMIT_REQUEST_LIMIT,
        evaluationWindowSec: RATE_LIMIT_EVAL_TIME_SECONDS,
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
  return rateLimitRule;
};

export const getRequestBodySizeLimitRule = function (
  priority: number,
  sizeLimitBytes: number
): wafv2.CfnWebACL.RuleProperty {
  const requestBodySizeLimitrule: wafv2.CfnWebACL.RuleProperty = {
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
  return requestBodySizeLimitrule;
};
