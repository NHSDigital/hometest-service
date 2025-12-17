import { Key, type IKey } from 'aws-cdk-lib/aws-kms';
import { type Construct } from 'constructs';

export function getKmsKeyById(
  scope: Construct,
  id: string,
  region: string,
  awsAccountId: string,
  kmsKeyId: string
): IKey {
  return Key.fromKeyArn(
    scope,
    id,
    `arn:aws:kms:${region}:${awsAccountId}:key/${kmsKeyId}`
  );
}
