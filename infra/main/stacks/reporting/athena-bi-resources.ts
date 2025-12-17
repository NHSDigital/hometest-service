import {
  type NhcReportingStack,
  type NhcReportingStackProps
} from './nhc-reporting-stack';
import { type Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { type IKey } from 'aws-cdk-lib/aws-kms';
import { NhcBucketFactory } from '../../../common/nhc-bucket-factory';
import { CfnWorkGroup } from 'aws-cdk-lib/aws-athena';

export function createAthenaBIResources(
  scope: NhcReportingStack,
  props: NhcReportingStackProps,
  kmsKey: IKey
): {
  workgroup: CfnWorkGroup;
  outputBucket: Bucket;
} {
  // Athena S3 output bucket
  const outputBucket = new NhcBucketFactory().create({
    scope,
    id: 'athena-output-bucket',
    bucketName: `${scope.account}-${scope.envName}-nhc-athena-output-data`,
    accessLoggingBucketName: props.envVariables.aws.accessLoggingBucketName,
    envType: props.envVariables.envType,
    accountNumber: scope.account,
    removalPolicy: props.envVariables.aws.removalPolicy,
    currentVersionExpirationDays: 7,
    nonCurrentVersionExpirationDays: 7,
    additionalProps: {
      encryption: BucketEncryption.KMS,
      encryptionKey: kmsKey
    }
  });

  // Athena workgroup
  const athenaWorkgroupName = `${scope.account}-${scope.envName}-bi-reporting`;
  const workgroup = new CfnWorkGroup(scope, 'athena-workgroup', {
    name: athenaWorkgroupName,
    description: 'Athena workgroup for BI reporting workflow',
    workGroupConfiguration: {
      enforceWorkGroupConfiguration: true,
      resultConfiguration: {
        outputLocation: `s3://${outputBucket.bucketName}/`,
        encryptionConfiguration: {
          encryptionOption: 'SSE_KMS',
          kmsKey: kmsKey.keyArn
        }
      }
    },
    recursiveDeleteOption: true
  });

  scope.createFlattenedViewQueries(props, workgroup);

  return {
    workgroup,
    outputBucket
  };
}
