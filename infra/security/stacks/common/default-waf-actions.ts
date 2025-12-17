import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { CUSTOM_API_BLOCKED_RESPONSE_BODY } from '../base-waf-stack';
import { WAFClassType } from '../../WAFClassType';

export const defaultFrontendBlockedAction: wafv2.CfnWebACL.BlockActionProperty =
  {};
export const defaultApiBlockedAction: wafv2.CfnWebACL.BlockActionProperty = {
  customResponse: {
    customResponseBodyKey: CUSTOM_API_BLOCKED_RESPONSE_BODY,
    responseCode: 403,
    responseHeaders: [{ name: 'cache-control', value: 'no-store' }]
  }
};

export function getBlockAction(
  wafClassType: WAFClassType
): wafv2.CfnWebACL.DefaultActionProperty {
  return {
    block:
      wafClassType === WAFClassType.gWAF
        ? defaultFrontendBlockedAction
        : defaultApiBlockedAction
  };
}

export function getAllowAction(): wafv2.CfnWebACL.DefaultActionProperty {
  return {
    allow: {}
  };
}
