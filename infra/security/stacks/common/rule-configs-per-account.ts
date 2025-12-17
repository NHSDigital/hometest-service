import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { type Construct } from 'constructs';
import { WAFClassType } from '../../WAFClassType';
import { makeRegionalNonProductionWAFRules } from './configurations/development/regional-WAF-Configuration';
import { makeCloudFrontNonProductionWAFRules } from './configurations/development/cloudFront-WAF-Configuration';
import { makeIntegratorNonProductionWAFRules } from './configurations/development/integrator-WAF-Configuration';
import { makeRegionalProductionLikeWAFRules } from './configurations/production-like/regional-WAF-Configuration';
import { makeCloudFrontProductionLikeWAFRules } from './configurations/production-like/cloudFront-WAF-Configuration';
import { makeIntegratorProductionLikeWAFRules } from './configurations/production-like/integrator-WAF-Configuration';
import { getAllowAction, getBlockAction } from './default-waf-actions';
import { makeRegionalProductionWAFRules } from './configurations/production/regional-WAF-Configuration';
import { makeCloudFrontProductionWAFRules } from './configurations/production/cloudFront-WAF-Configuration';
import { makeIntegratorProductionWAFRules } from './configurations/production/integrator-WAF-Configuration';
import { AWSAccountNumbers } from '../../../../shared';

export const getWAFRules = function (
  scope: Construct,
  region: string,
  accountID: any,
  wafClassType: WAFClassType,
  includeIpAllowlist: boolean = true
): wafv2.CfnWebACL.RuleProperty[] {
  switch (accountID) {
    case AWSAccountNumbers.POC:
      return developmentWAFRules(
        scope,
        region,
        wafClassType,
        includeIpAllowlist
      );
    case AWSAccountNumbers.INT:
      return productionLikeWAFRules(
        scope,
        region,
        wafClassType,
        includeIpAllowlist
      );
    case AWSAccountNumbers.TEST:
      return productionLikeWAFRules(
        scope,
        region,
        wafClassType,
        includeIpAllowlist
      );
    case AWSAccountNumbers.PROD:
      return productionWAFRules(
        scope,
        region,
        wafClassType,
        includeIpAllowlist
      );
    default:
      throw new ReferenceError(
        `Account ID: ${accountID} not defined in rule-configs-per-account function`
      );
  }
};

export const getDefaultWAFAction = function (
  accountID: any,
  wafClassType: WAFClassType
): wafv2.CfnWebACL.DefaultActionProperty {
  switch (accountID) {
    case AWSAccountNumbers.POC:
    case AWSAccountNumbers.INT:
      if (wafClassType === WAFClassType.noIPiWAF) {
        return getAllowAction();
      } else {
        return getBlockAction(wafClassType);
      }
    case AWSAccountNumbers.TEST:
      if (wafClassType === WAFClassType.noIPiWAF) {
        return getAllowAction();
      } else {
        return getBlockAction(wafClassType);
      }
    case AWSAccountNumbers.PROD: {
      if (wafClassType === WAFClassType.iWAF) {
        return getBlockAction(wafClassType);
      } else {
        return getAllowAction();
      }
    }
    default:
      throw new ReferenceError(
        `Account ID: ${accountID} not defined in rule-configs-per-account function`
      );
  }
};

const developmentWAFRules = function (
  scope: Construct,
  region: string,
  wafClassType: WAFClassType,
  includeIpAllowlist: boolean = true
): wafv2.CfnWebACL.RuleProperty[] {
  switch (wafClassType) {
    case WAFClassType.rWAF:
      return makeRegionalNonProductionWAFRules(scope, region);
    case WAFClassType.gWAF:
      return makeCloudFrontNonProductionWAFRules(scope, region);
    case WAFClassType.noIPiWAF:
    case WAFClassType.iWAF:
      return makeIntegratorNonProductionWAFRules(
        scope,
        region,
        includeIpAllowlist
      );
    default:
      throw new ReferenceError('Invalid WAF Class Type passed to ruleset');
  }
};

// logic - if IP allowlist option true, default action is block, IP lists and rulesets added
// if IP allowlist false, default action allow
// if production workload, detection rules action set to block
// if non-production workload, detection rules set to count

const productionLikeWAFRules = function (
  scope: Construct,
  region: string,
  wafClassType: WAFClassType,
  includeIpAllowlist: boolean = true
): wafv2.CfnWebACL.RuleProperty[] {
  switch (wafClassType) {
    case WAFClassType.rWAF:
      return makeRegionalProductionLikeWAFRules(scope, region);
    case WAFClassType.gWAF:
      return makeCloudFrontProductionLikeWAFRules(scope, region);
    case WAFClassType.noIPiWAF:
    case WAFClassType.iWAF:
      return makeIntegratorProductionLikeWAFRules(
        scope,
        region,
        includeIpAllowlist
      );
    default:
      throw new ReferenceError('Invalid WAF Class Type passed to ruleset');
  }
};

const productionWAFRules = function (
  scope: Construct,
  region: string,
  wafClassType: WAFClassType,
  includeIpAllowlist: boolean = true
): wafv2.CfnWebACL.RuleProperty[] {
  switch (wafClassType) {
    case WAFClassType.rWAF:
      return makeRegionalProductionWAFRules();
    case WAFClassType.gWAF:
      return makeCloudFrontProductionWAFRules();
    case WAFClassType.noIPiWAF:
    case WAFClassType.iWAF:
      return makeIntegratorProductionWAFRules(
        scope,
        region,
        includeIpAllowlist
      );
    default:
      throw new ReferenceError('Invalid WAF Class Type passed to ruleset');
  }
};
