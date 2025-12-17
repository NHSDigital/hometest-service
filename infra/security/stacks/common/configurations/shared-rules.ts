import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';

export const RATE_LIMIT_REQUEST_LIMIT = 1000; // The Number of requests before an IP is rate limited
export const RATE_LIMIT_EVAL_TIME_SECONDS = 60; // The time window in which the requests are evaluated (in seconds)
export const REQUEST_BODY_SIZE_LIMIT_BYTES = 8192; // The number of Bytes allowed in the body of a single request

// Allow JWKS JSON endpoint
export const getJWKSAllowRule = function (
  priority: number
): wafv2.CfnWebACL.RuleProperty {
  return {
    name: 'AllowJWKSJson',
    priority,
    action: { allow: {} },
    statement: {
      byteMatchStatement: {
        fieldToMatch: { uriPath: {} },
        positionalConstraint: 'EXACTLY',
        searchString: '/.well-known/jwks.json',
        textTransformations: [
          {
            priority: 0,
            type: 'NONE'
          }
        ]
      }
    },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      metricName: 'AllowJWKSJson',
      sampledRequestsEnabled: true
    }
  };
};

// Allow access to the main CSS file used by static pages,
// such as the Access Denied and Service Maintenance screens.
export const getMainCssAllowRule = function (
  priority: number
): wafv2.CfnWebACL.RuleProperty {
  return {
    name: 'AllowMainCss',
    priority,
    action: { allow: {} },
    statement: {
      andStatement: {
        statements: [
          {
            byteMatchStatement: {
              searchString: '/static/css/main',
              fieldToMatch: { uriPath: {} },
              textTransformations: [{ priority: 0, type: 'NONE' }],
              positionalConstraint: 'STARTS_WITH'
            }
          },
          {
            orStatement: {
              statements: [
                {
                  byteMatchStatement: {
                    searchString: 'GET',
                    fieldToMatch: { method: {} },
                    textTransformations: [{ priority: 0, type: 'NONE' }],
                    positionalConstraint: 'EXACTLY'
                  }
                },
                {
                  byteMatchStatement: {
                    searchString: 'OPTIONS',
                    fieldToMatch: { method: {} },
                    textTransformations: [{ priority: 0, type: 'NONE' }],
                    positionalConstraint: 'EXACTLY'
                  }
                }
              ]
            }
          }
        ]
      }
    },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      metricName: 'AllowMainCss',
      sampledRequestsEnabled: true
    }
  };
};
