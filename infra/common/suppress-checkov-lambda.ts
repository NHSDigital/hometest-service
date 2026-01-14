import { type IAspect, CfnResource } from 'aws-cdk-lib';
import type { IConstruct } from 'constructs';

export class SuppressCheckovLambdaEncryptionEnv implements IAspect {
  visit(node: IConstruct): void {
    if (
      node instanceof CfnResource &&
      node.cfnResourceType === 'AWS::Lambda::Function'
    ) {
      const logicalId = node.logicalId;
      if (
        logicalId.includes('CustomCDKBucketD') || // Bucket Deployment lambdas
        logicalId.includes('CustomS3AutoD') || // S3 Auto Delete lambdas
        logicalId.includes('BucketNotification') // Bucket Notification lambdas
      ) {
        node.addMetadata('checkov', {
          skip: [
            {
              id: 'CKV_AWS_173',
              comment:
                'Lambda created automatically by CDK construct. Cannot set KMS_KEY_ARN for env variables.'
            }
          ]
        });
      }
    }
  }
}
