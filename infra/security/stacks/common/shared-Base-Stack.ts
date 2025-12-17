import { type CfnElement, Stack, type StackProps, Tags } from 'aws-cdk-lib';
import { type Construct } from 'constructs';
import { type NHCEnvVariables } from '../../settings';

export interface NhcSharedStackProps extends StackProps {
  envVariables: NHCEnvVariables;
}

export class SharedBaseStack extends Stack {
  readonly envName: string;
  readonly stackBaseName: string;
  readonly version: string;

  constructor(
    scope: Construct,
    id: string,
    envName: string,
    version: string,
    props?: StackProps
  ) {
    const terminationProtection =
      process.env.STACK_TERMINATION_PROTECTION_ENABLED === 'true';

    super(scope, addEnvPrefixToPhysicalId(envName, id, version), {
      ...props,
      terminationProtection
    });

    this.envName = envName;
    this.stackBaseName = id;
    this.version = version;
    this.tagAllStackResources();
  }

  public allocateLogicalId(element: CfnElement): string {
    const originalLogicalId = super.allocateLogicalId(element);
    return addEnvPrefixToLogicalId(
      this.envName,
      originalLogicalId,
      this.version
    );
  }

  private tagAllStackResources(): void {
    if (this.envName !== '') {
      Tags.of(this).add('nhc_env', this.envName);
    }
  }
}

export function addEnvPrefixToPhysicalId(
  prefix: string,
  resourceName: string,
  version: string
): string {
  return `${prefix}-${resourceName}-${version}`;
}

function addEnvPrefixToLogicalId(
  prefix: string,
  resourceName: string,
  version: string
): string {
  return `${prefix}${resourceName}${version}`;
}

export function translateRegionToCSOCDestinationArn(
  region: string | undefined
): string {
  switch (region) {
    case 'eu-west-2':
      return 'arn:aws:logs:eu-west-2:693466633220:destination:waf_log_destination'; // Hardcoded as per https://nhsd-confluence.digital.nhs.uk/spaces/CCEP/pages/394532589/WAF+v2+EU-West-2
    case 'us-east-1':
      return 'arn:aws:logs:us-east-1:693466633220:destination:waf_log_destination_virginia'; // Hardcoded as per https://nhsd-confluence.digital.nhs.uk/spaces/CCEP/pages/520329072/WAF+v2+US-East-1
    default:
      throw new ReferenceError(
        `Account ID: ${region} not defined in rule-configs-per-account function`
      );
  }
}
