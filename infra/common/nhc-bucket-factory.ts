import type { Construct } from 'constructs';
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import {
  BlockPublicAccess,
  Bucket,
  type IBucket,
  type BucketProps,
  BucketEncryption
} from 'aws-cdk-lib/aws-s3';
import { BackupTags, EnvType } from './lib/enums';
import { AWSAccountNumbers } from '../../shared';

interface NhcBucketFactoryProps {
  scope: Construct;
  id: string;
  bucketName: string;
  accessLoggingBucketName: string | undefined;
  envType: string;
  accountNumber: string;
  removalPolicy: RemovalPolicy;
  additionalProps?: Partial<BucketProps>;
  currentVersionExpirationDays?: number;
  nonCurrentVersionExpirationDays?: number;
  versioned?: boolean;
}

class AccessLogsBucket {
  private static bucket: IBucket;
  private constructor() {}

  static getBucket(scope: Construct, accessLoggingBucketName: string): IBucket {
    this.bucket ??= Bucket.fromBucketName(
      scope,
      'nhc-access-logs-bucket',
      accessLoggingBucketName
    );
    return this.bucket;
  }
}

export class NhcBucketFactory {
  public create(bucketFactoryProps: NhcBucketFactoryProps): Bucket {
    // Build default lifecycle rules
    const defaultLifecycleRules = [
      {
        // Abort incomplete multipart uploads after 7 days
        abortIncompleteMultipartUploadAfter: Duration.days(7),
        // Keep up to 10 non-current versions
        noncurrentVersionsToRetain: 10,
        // Delete non-current versions after specified days (default: 30)
        noncurrentVersionExpiration: Duration.days(
          bucketFactoryProps.nonCurrentVersionExpirationDays ?? 30
        ),
        // Optionally expire current versions
        ...(bucketFactoryProps.currentVersionExpirationDays && {
          expiration: Duration.days(
            bucketFactoryProps.currentVersionExpirationDays
          )
        })
      }
    ];

    if (
      bucketFactoryProps.versioned === false &&
      (bucketFactoryProps.accountNumber === AWSAccountNumbers.PROD ||
        bucketFactoryProps.accountNumber === AWSAccountNumbers.TEST)
    ) {
      throw new Error(
        `Versioning should not be disabled for bucket ${bucketFactoryProps.bucketName} in PROD or TEST accounts. Confirm those requirements before implementing.`
      );
    }

    // Merge with additional lifecycle rules from additionalProps if provided
    const lifecycleRules = bucketFactoryProps.additionalProps?.lifecycleRules
      ? [
          ...defaultLifecycleRules,
          ...bucketFactoryProps.additionalProps.lifecycleRules
        ]
      : defaultLifecycleRules;

    const bucketBaseProps: BucketProps = {
      ...bucketFactoryProps.additionalProps,
      bucketName: bucketFactoryProps.bucketName,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: bucketFactoryProps.removalPolicy,
      autoDeleteObjects:
        bucketFactoryProps.removalPolicy === RemovalPolicy.DESTROY,
      enforceSSL: true,
      bucketKeyEnabled:
        bucketFactoryProps.additionalProps?.encryption !== undefined &&
        [
          BucketEncryption.KMS,
          BucketEncryption.DSSE,
          BucketEncryption.S3_MANAGED
        ].includes(bucketFactoryProps.additionalProps?.encryption),
      minimumTLSVersion: 1.2,
      ...(bucketFactoryProps.accessLoggingBucketName && {
        serverAccessLogsBucket: AccessLogsBucket.getBucket(
          bucketFactoryProps.scope,
          bucketFactoryProps.accessLoggingBucketName
        ),
        serverAccessLogsPrefix: `${bucketFactoryProps.envType}/${bucketFactoryProps.accountNumber}/${bucketFactoryProps.bucketName}/`
      }),
      versioned:
        bucketFactoryProps.versioned ??
        (bucketFactoryProps.accountNumber === AWSAccountNumbers.PROD ||
          bucketFactoryProps.accountNumber === AWSAccountNumbers.TEST),
      lifecycleRules
    };

    const bucket = new Bucket(
      bucketFactoryProps.scope,
      bucketFactoryProps.id,
      bucketBaseProps
    );

    if (bucketFactoryProps.envType === EnvType.PROD) {
      Tags.of(bucket).add(BackupTags.DailyBackup, 'true');
    }

    return bucket;
  }
}
