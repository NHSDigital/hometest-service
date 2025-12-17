import { PolicyStatement, Effect, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ReceiptRuleSet, ReceiptRule } from 'aws-cdk-lib/aws-ses';
import { Sns } from 'aws-cdk-lib/aws-ses-actions';
import * as ses from 'aws-cdk-lib/aws-ses';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { LambdaSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { type Construct } from 'constructs';
import { BaseStack } from '../../common/base-stack';
import { NhsAlarmFactory } from '../../common/nhc-alarm-factory';
import { NhcBucketFactory } from '../../common/nhc-bucket-factory';
import { NhcLambdaFactory } from '../../common/nhc-lambda-factory';
import { BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { type NHCEnvVariables } from '../settings';
import { HostedZone, RecordSet, RecordType } from 'aws-cdk-lib/aws-route53';
import { CrossAccountRoute53RecordSet } from 'cdk-cross-account-route53';
import { RemovalPolicy, type StackProps } from 'aws-cdk-lib';
import { NhcTopic } from '../../common/lib/enums';
import type { IKey } from 'aws-cdk-lib/aws-kms';

export interface NhcEmailVerificationStackProps extends StackProps {
  envVariables: NHCEnvVariables;
}

export class NhcEmailVerificationStack extends BaseStack {
  readonly kmsKey: IKey;
  readonly managementAccountId: string;
  readonly kmsKeyId: string;
  constructor(
    scope: Construct,
    id: string,
    props: NhcEmailVerificationStackProps
  ) {
    super(
      scope,
      id,
      props.envVariables.common.envName,
      props.envVariables.nhcVersion
    );

    this.managementAccountId = props.envVariables.aws.managementAccountId;
    this.kmsKeyId = props.envVariables.security.kmsKeyId;

    this.kmsKey = this.getKmsKeyById(
      props.envVariables.aws.managementAccountId,
      this.kmsKeyId
    );

    const alarmsFactory = new NhsAlarmFactory({
      alarmsEnabled: false,
      nhcTopic: NhcTopic.STANDARD
    });

    const snsKmsKey = this.getKmsKey(
      this.account,
      props.envVariables.security.snsKmsKeyAliasName
    );

    const lambdaFactory = new NhcLambdaFactory(
      this,
      this.stackBaseName,
      props.envVariables,
      alarmsFactory,
      false,
      false,
      'nhc-mock'
    );

    const topic = new Topic(this, 'email-verification-topic', {
      topicName: 'nhc-email-verification-topic',
      masterKey: snsKmsKey
    });

    const bucketName = `${this.account}-email-verification`;
    const emailBucket = new NhcBucketFactory().create({
      scope: this,
      id: 'email-verification',
      bucketName,
      accessLoggingBucketName: props.envVariables.accessLoggingBucketName,
      envType: props.envVariables.envType,
      accountNumber: this.account,
      removalPolicy: RemovalPolicy.DESTROY,
      currentVersionExpirationDays: 7,
      nonCurrentVersionExpirationDays: 7,
      additionalProps: {
        encryption: BucketEncryption.KMS,
        encryptionKey: this.kmsKey
      }
    });

    const lambdaFn = lambdaFactory.createLambda({
      name: 'email-verification-lambda',
      environment: {
        EMAIL_VERIFICATION_DOMAIN: props.envVariables.emailVerificationDomain
      },
      alarmConfig: {
        createLambdaErrorAlarm: true,
        createLambdaThrottlesAlarm: true,
        createLambdaDurationAlarm: false,
        createLambdaNotInvokedAlarm: false
      }
    });

    lambdaFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey*'],
        resources: [
          `arn:aws:kms:eu-west-2:${this.account}:key/${snsKmsKey.keyId}`
        ]
      })
    );

    lambdaFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey*'],
        resources: [this.kmsKey.keyArn]
      })
    );
    emailBucket.grantWrite(lambdaFn);

    topic.addSubscription(new LambdaSubscription(lambdaFn));
    topic.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal('ses.amazonaws.com')],
        actions: ['SNS:Publish'],
        resources: [topic.topicArn]
      })
    );

    const ruleSet = new ReceiptRuleSet(this, 'email-verification-rule-set', {
      receiptRuleSetName: 'email-verification-rule-set'
    });

    const addRouteDhctestOrgToSnsRule = (): ReceiptRule => {
      return new ReceiptRule(this, 'dhctest-email-to-sns-route', {
        ruleSet,
        recipients: [
          `email-verification@${props.envVariables.emailVerificationDomain}`
        ],
        actions: [new Sns({ topic })],
        enabled: true,
        scanEnabled: true
      });
    };
    addRouteDhctestOrgToSnsRule();

    const emailIdentity = new ses.EmailIdentity(
      this,
      'email-verification-identity',
      {
        identity: ses.Identity.domain(
          props.envVariables.emailVerificationDomain
        )
      }
    );

    if (
      props.envVariables.common.accountName === 'test' ||
      props.envVariables.common.accountName === 'int'
    ) {
      new CrossAccountRoute53RecordSet(this, 'email-dns-records', {
        delegationRoleName:
          props.envVariables.aws.managementAccountRoute53RoleName,
        delegationRoleAccount: props.envVariables.aws.managementAccountId,
        hostedZoneId: props.envVariables.aws.hostedZoneId,
        resourceRecordSets: [
          {
            Name: props.envVariables.emailVerificationDomain,
            Type: RecordType.MX,
            TTL: 60,
            ResourceRecords: [
              { Value: '10 inbound-smtp.eu-west-2.amazonaws.com' }
            ]
          },
          {
            Name: emailIdentity.dkimDnsTokenName1,
            Type: RecordType.CNAME,
            TTL: 60,
            ResourceRecords: [{ Value: emailIdentity.dkimDnsTokenValue1 }]
          },
          {
            Name: emailIdentity.dkimDnsTokenName2,
            Type: RecordType.CNAME,
            TTL: 60,
            ResourceRecords: [{ Value: emailIdentity.dkimDnsTokenValue2 }]
          },
          {
            Name: emailIdentity.dkimDnsTokenName3,
            Type: RecordType.CNAME,
            TTL: 60,
            ResourceRecords: [{ Value: emailIdentity.dkimDnsTokenValue3 }]
          }
        ]
      });
    } else {
      const hostedZone = HostedZone.fromHostedZoneAttributes(
        this,
        'hosted-zone-dhctest',
        {
          hostedZoneId: props.envVariables.aws.hostedZoneId,
          zoneName: props.envVariables.emailVerificationDomain
        }
      ) as HostedZone;

      new RecordSet(this, 'MXRecord', {
        zone: hostedZone,
        recordName: props.envVariables.emailVerificationDomain,
        recordType: RecordType.MX,
        target: {
          values: ['10 inbound-smtp.eu-west-2.amazonaws.com']
        }
      });

      new RecordSet(this, 'DKIMRecord1', {
        zone: hostedZone,
        recordName: emailIdentity.dkimDnsTokenName1,
        recordType: RecordType.CNAME,
        target: {
          values: [emailIdentity.dkimDnsTokenValue1]
        }
      });

      new RecordSet(this, 'DKIMRecord2', {
        zone: hostedZone,
        recordName: emailIdentity.dkimDnsTokenName2,
        recordType: RecordType.CNAME,
        target: {
          values: [emailIdentity.dkimDnsTokenValue2]
        }
      });

      new RecordSet(this, 'DKIMRecord3', {
        zone: hostedZone,
        recordName: emailIdentity.dkimDnsTokenName3,
        recordType: RecordType.CNAME,
        target: {
          values: [emailIdentity.dkimDnsTokenValue3]
        }
      });
    }
  }
}
