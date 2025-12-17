export const initializeEnvVariables = function (
  envName: string
): NHCEnvVariables {
  return {
    common: {
      envName
    },
    nhcVersion: process.env.NHC_VERSION ?? '',
    security: {
      kmsKeyId: process.env.KMS_KEY_ID ?? '',
      kmsCloudFrontRegionKeyId: process.env.KMS_CLOUD_FRONT_REGION_KEY_ID ?? ''
    },
    aws: {
      managementAccountId: process.env.MANAGEMENT_ACCOUNT_ID ?? ''
    }
  };
};

export interface NHCEnvVariables {
  common: {
    envName: string;
  };
  nhcVersion: string;
  security: {
    kmsKeyId: string;
    kmsCloudFrontRegionKeyId?: string;
  };
  aws: {
    managementAccountId: string;
  };
}
