import { type Construct } from 'constructs';
import {
  SharedBaseStack,
  type NhcSharedStackProps
} from './common/shared-Base-Stack';
import { type WAFResourceScope } from './common/WAF-Resource-Scope';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { IPAddresses } from './non-production-resources/ip-allow-list-POC';
import { ThrivaIPAddressesNonProd } from './non-production-resources/ip-allow-list-thriva-non-prod';
import { ThrivaIPAddressesProduction } from './production-resources/ip-allow-list-thriva-prod';
import { GHRunnersIPAddresses } from './non-production-resources/ip-allow-list-github-runners';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { APIMIPAddressesNonProd } from './non-production-resources/ip-allow-list-APIM-non-prod';
import { AWSAccountNumbers } from '../../../shared';

// Conditionally deploys IP lists to an account
// Production & Production-Like workloads only have IP lists for integrator (Thriva Results)
// Note - IP lists have had to be broken out to their own stack, due to a dependency ordering issue when
// A WAF attempts to reference an IP list that is still undergoing creation

export class IPListsStack extends SharedBaseStack {
  constructor(
    scope: Construct,
    id: string,
    props: NhcSharedStackProps,
    wafResourceScope: WAFResourceScope,
    version: string
  ) {
    super(scope, id, props.envVariables.common.envName, version, props);
    const region = props.env?.region;
    const accountID = process.env.CDK_DEFAULT_ACCOUNT;

    switch (accountID) {
      case AWSAccountNumbers.POC:
        this.makeDevelopmentIPLists(this, region, wafResourceScope, version);
        break;

      case AWSAccountNumbers.INT:
        this.makeDevelopmentIPLists(this, region, wafResourceScope, version);
        this.makeProductionLikeIPLists(this, region, wafResourceScope, version);
        break;

      case AWSAccountNumbers.TEST:
        this.makeDevelopmentIPLists(this, region, wafResourceScope, version);
        this.makeProductionLikeIPLists(this, region, wafResourceScope, version);
        break;

      case AWSAccountNumbers.PROD:
        this.makeDevelopmentIPLists(this, region, wafResourceScope, version);
        this.makeProductionIPLists(this, region, wafResourceScope, version);
        break;

      default:
        throw new ReferenceError(
          `Account ID: ${accountID} not defined in rule-configs-per-account function`
        );
    }
  }

  makeDevelopmentIPLists = function (
    scope: Construct,
    region: any,
    wafResourceScope: WAFResourceScope,
    version: string
  ): void {
    console.log(`region is: ${region}`);
    const ipList = createIPList(
      scope,
      `IPList-${region}-${wafResourceScope}-${version}`,
      IPAddresses,
      wafResourceScope
    );

    const ipListGH = createIPList(
      scope,
      `IPListGH-${region}-${wafResourceScope}-${version}`,
      GHRunnersIPAddresses,
      wafResourceScope
    );

    new ssm.StringParameter(
      scope,
      `IPList-${region}-${wafResourceScope}v5ARN`,
      {
        parameterName: `IPList-${region}-${wafResourceScope}v5ARN`,
        stringValue: ipList.attrArn
      }
    );

    new ssm.StringParameter(
      scope,
      `IPListGH-${region}-${wafResourceScope}v5ARN`,
      {
        parameterName: `IPListGH-${region}-${wafResourceScope}v5ARN`,
        stringValue: ipListGH.attrArn
      }
    );

    console.log(`full name is: IPList-${region}-${wafResourceScope}v5ARN`);
  };

  makeProductionLikeIPLists = function (
    scope: Construct,
    region: any,
    wafResourceScope: WAFResourceScope,
    version: string
  ): void {
    console.log(`region is: ${region}`);
    const ipList = createIPList(
      scope,
      `IPList-Thriva-${region}-${wafResourceScope}-${version}`,
      ThrivaIPAddressesNonProd.concat(APIMIPAddressesNonProd),
      wafResourceScope
    );

    new ssm.StringParameter(
      scope,
      `IPList-Thriva-${region}-${wafResourceScope}v5ARN`,
      {
        parameterName: `IPList-Thriva-${region}-${wafResourceScope}v5ARN`,
        stringValue: ipList.attrArn
      }
    );
    console.log(`full name is: IPList-${region}-${wafResourceScope}v5ARN`);
  };

  makeProductionIPLists = function (
    scope: Construct,
    region: any,
    wafResourceScope: WAFResourceScope,
    version: string
  ): void {
    console.log(`region is: ${region}`);
    const ipList = createIPList(
      scope,
      `IPList-Thriva-${region}-${wafResourceScope}-${version}`,
      ThrivaIPAddressesProduction,
      wafResourceScope
    );

    new ssm.StringParameter(
      scope,
      `IPList-Thriva-${region}-${wafResourceScope}v5ARN`,
      {
        parameterName: `IPList-Thriva-${region}-${wafResourceScope}v5ARN`,
        stringValue: ipList.attrArn
      }
    );
    console.log(`full name is: IPList-${region}-${wafResourceScope}v5ARN`);
  };
}

function createIPList(
  scope: Construct,
  name: string,
  IPAddresses: string[],
  wafResourceScope: WAFResourceScope
): wafv2.CfnIPSet {
  const ipset = new wafv2.CfnIPSet(scope, name, {
    addresses: IPAddresses,
    ipAddressVersion: 'IPV4',
    scope: wafResourceScope, // 'CLOUDFRONT' for global scope or Regional for APIGWs
    description: 'CFD IP whitelist',
    name
  });
  return ipset;
}
