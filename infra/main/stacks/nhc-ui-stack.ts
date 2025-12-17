import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import type * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { type Construct } from 'constructs';
import * as path from 'path';
import { BaseStack } from '../../common/base-stack';
import { CfnOutput, Duration, type StackProps } from 'aws-cdk-lib';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { type NHCEnvVariables } from '../settings';
import * as cdk from 'aws-cdk-lib';
import * as shield from 'aws-cdk-lib/aws-shield';
import { CrossAccountRoute53RecordSet } from 'cdk-cross-account-route53';
import { NhcBucketFactory } from '../../common/nhc-bucket-factory';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { EnvType } from '../../common/lib/enums';
import { NhcCloudfrontFunction } from '../../common/nhc-cloudfront-function';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CfnDocument } from 'aws-cdk-lib/aws-ssm';

interface NhcUiStackProps extends StackProps {
  envVariables: NHCEnvVariables;
}

export class NhcUiStack extends BaseStack {
  public cloudfrontArn: string;
  private keyValueStoreArn: string;

  constructor(scope: Construct, id: string, props: NhcUiStackProps) {
    super(
      scope,
      id,
      props.envVariables.common.envName,
      props.envVariables.nhcVersion
    );

    const siteBucket = this.createSiteBucket(props);
    const cloudfrontDistribution = this.createCloudfrontDistribution(
      siteBucket,
      props.envVariables
    );
    this.allowSiteToBeAccessedFromCloudfront(
      siteBucket,
      cloudfrontDistribution.distributionId
    );
    this.uploadSiteContentToS3Bucket(siteBucket, cloudfrontDistribution);

    this.createServiceStateSwitchRunbook();

    // stack outputs
    new CfnOutput(this, 'SiteBucket', { value: siteBucket.bucketName });
    new CfnOutput(this, 'CloudfrontDistributionId', {
      value: cloudfrontDistribution.distributionId
    });
    new CfnOutput(this, 'CloudfrontDistributionDomainName', {
      value: cloudfrontDistribution.domainName
    });
  }

  createSiteBucket(props: NhcUiStackProps): s3.Bucket {
    const bucketName = `${this.account}-${this.envName}-nhc-ui-bucket`;
    const bucket = new NhcBucketFactory().create({
      scope: this,
      id: 'nhc-ui-bucket',
      bucketName,
      accessLoggingBucketName: props.envVariables.aws.accessLoggingBucketName,
      envType: props.envVariables.envType,
      accountNumber: this.account,
      removalPolicy: props.envVariables.aws.removalPolicy
    });
    return bucket;
  }

  allowSiteToBeAccessedFromCloudfront(
    siteBucket: s3.Bucket,
    distributionId: string
  ): void {
    siteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [siteBucket.arnForObjects('*')],
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${distributionId}`
          }
        }
      })
    );
  }

  createCloudfrontDistribution(
    siteBucket: s3.Bucket,
    envVariables: NHCEnvVariables
  ): cloudfront.Distribution {
    const cloudfrontDistributionName = `${this.envName}-nhc-site-distribution`;
    const domainName = envVariables.aws.cloudfrontDomainName;
    const siteDomain =
      envVariables.envType === EnvType.PROD
        ? domainName
        : `${this.envName}.${domainName}`;

    const cert = Certificate.fromCertificateArn(
      this,
      'test-nhc-cert',
      envVariables.aws.cloudfrontCertificateArn
    );

    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      'SecurityHeadersPolicy',
      {
        responseHeadersPolicyName: `${this.envName}-security-headers-policy`,
        comment: 'Security headers policy for CloudFront',
        securityHeadersBehavior: {
          contentSecurityPolicy: {
            contentSecurityPolicy: `default-src 'self' *.${envVariables.aws.cloudfrontDomainName}; script-src 'self' *.service.nhs.uk *.${envVariables.aws.cloudfrontDomainName}; connect-src 'self' *.${envVariables.aws.cloudfrontDomainName} https://cognito-identity.eu-west-2.amazonaws.com https://dataplane.rum.eu-west-2.amazonaws.com; frame-ancestors 'self'; font-src 'self' assets.nhs.uk; img-src 'self' data:`,
            override: true
          },
          strictTransportSecurity: {
            accessControlMaxAge: Duration.seconds(31536000),
            includeSubdomains: true,
            preload: false,
            override: true
          },
          xssProtection: {
            protection: true,
            modeBlock: true,
            override: true
          },
          frameOptions: {
            frameOption: cloudfront.HeadersFrameOption.DENY,
            override: true
          },
          referrerPolicy: {
            referrerPolicy:
              cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
            override: true
          },
          contentTypeOptions: {
            override: true
          }
        }
      }
    );

    const viewerRequestHandler = new NhcCloudfrontFunction(
      this,
      this.envName,
      'ui-viewer-request-handler'
    );
    this.keyValueStoreArn = viewerRequestHandler.keyValueStoreArn;

    const distribution = new cloudfront.Distribution(
      this,
      cloudfrontDistributionName,
      {
        defaultRootObject: 'index.html',
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        domainNames: [siteDomain],
        certificate: cert,
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/access-denied.html',
            ttl: Duration.minutes(30)
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
            ttl: Duration.minutes(30)
          }
        ],
        defaultBehavior: {
          origin: S3BucketOrigin.withOriginAccessControl(siteBucket, {
            originAccessControl: new cloudfront.S3OriginAccessControl(
              this,
              'cloudfront-OAC',
              {
                originAccessControlName: `${this.envName}-nhc-ui-oac`,
                description: `OAC for ${siteBucket.bucketName}`
              }
            )
          }),
          compress: true,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          functionAssociations: [
            {
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
              function: viewerRequestHandler
            }
          ],
          responseHeadersPolicy
        },
        webAclId: ssm.StringParameter.fromStringParameterName(
          this,
          'wafARNUIStackk',
          'GlobalCFDWafARNv5'
        ).stringValue
      }
    );

    this.cloudfrontArn = `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${distribution.distributionId}`;

    new shield.CfnProtection(this, 'nhc-shield', {
      name: `${this.envName}-shield-protection`,
      resourceArn: this.cloudfrontArn,
      applicationLayerAutomaticResponseConfiguration: {
        status: 'ENABLED',
        action: { count: {} } // Review findings before enabling 'block: {}' action
      }
    });

    if (envVariables.aws.createRoute53RecordsInManagementAccount) {
      this.createRoute53RecordInManagementAccount(
        envVariables,
        siteDomain,
        distribution
      );
    } else {
      this.createRoute53RecordInCurrentAccount(
        envVariables,
        domainName,
        siteDomain,
        distribution
      );
    }

    return distribution;
  }

  private createRoute53RecordInCurrentAccount(
    envVariables: NHCEnvVariables,
    domainName: string,
    siteDomain: string,
    distribution: cloudfront.Distribution
  ): void {
    const hostedZone = HostedZone.fromHostedZoneAttributes(
      this,
      'hosted-zone',
      {
        hostedZoneId: envVariables.aws.hostedZoneId,
        zoneName: domainName
      }
    );

    new ARecord(this, 'Alias', {
      recordName: siteDomain,
      zone: hostedZone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution))
    });
  }

  private createRoute53RecordInManagementAccount(
    envVariables: NHCEnvVariables,
    siteDomain: string,
    distribution: cloudfront.Distribution
  ): void {
    new CrossAccountRoute53RecordSet(this, 'cloudfront-dns-record', {
      delegationRoleName: envVariables.aws.managementAccountRoute53RoleName,
      delegationRoleAccount: envVariables.aws.managementAccountId,
      hostedZoneId: envVariables.aws.hostedZoneId,
      resourceRecordSets: [
        {
          Name: siteDomain,
          Type: 'A',
          AliasTarget: {
            DNSName: distribution.distributionDomainName,
            HostedZoneId: envVariables.aws.cloudfrontHostedZoneId,
            EvaluateTargetHealth: false
          }
        }
      ]
    });
  }

  uploadSiteContentToS3Bucket(
    siteBucket: s3.Bucket,
    cloudfrontDistribution: cloudfront.Distribution
  ): s3deploy.BucketDeployment {
    const siteDeploymentName = `${this.envName}-nhc-site-deployment`;

    const bucketDeployment = new s3deploy.BucketDeployment(
      this,
      siteDeploymentName,
      {
        sources: [
          s3deploy.Source.asset(path.join(__dirname, './../../../ui/build'))
        ],
        destinationBucket: siteBucket,
        distribution: cloudfrontDistribution,
        distributionPaths: ['/*']
      }
    );

    return bucketDeployment;
  }

  createServiceStateSwitchRunbook(): void {
    const switchRunbookRole = new iam.Role(
      this,
      `${this.envName}-switch-runbook-role`,
      {
        assumedBy: new iam.ServicePrincipal('ssm.amazonaws.com'),
        roleName: `${this.envName}-nhc-service-state-switch-runbook-role`
      }
    );
    switchRunbookRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudfront-keyvaluestore:DescribeKeyValueStore',
          'cloudfront-keyvaluestore:PutKey'
        ],
        resources: [this.keyValueStoreArn]
      })
    );

    new CfnDocument(this, `${this.envName}-service-state-switch-runbook`, {
      name: `nhc-${this.envName}-service-state-switch-runbook`,
      documentType: 'Automation',
      updateMethod: 'NewVersion',
      content: {
        assumeRole: switchRunbookRole.roleArn,
        schemaVersion: '0.3',
        description:
          "This is a runbook to switch the service on and off, by updating the CloudFront KeyValueStore's 'isServiceDown' key",
        parameters: {
          serviceState: {
            type: 'String',
            allowedValues: ['on', 'off'],
            description: 'Set service state to: on/off'
          }
        },
        mainSteps: [
          {
            name: 'RunScript',
            action: 'aws:executeScript',
            isEnd: true,
            inputs: {
              Runtime: 'python3.11',
              Handler: 'script_handler',
              Script: `import boto3\nfrom botocore.config import Config\n\ndef script_handler(events, context):\n  storeArn = '${this.keyValueStoreArn}'\n  isServiceDown = 'true' if events['serviceState'] == 'off' else 'false'\n\n  config = Config(\n    signature_version='v4',\n    region_name='us-east-1'\n  )\n  client = boto3.client('cloudfront-keyvaluestore', config=config)\n  \n  response = client.describe_key_value_store(\n    KvsARN=storeArn\n  )\n  eTag = response['ETag']\n\n  client.put_key(\n    Key='isServiceDown',\n    Value=isServiceDown,\n    KvsARN=storeArn,\n    IfMatch=eTag\n  )`,
              InputPayload: {
                serviceState: '{{ serviceState }}'
              }
            }
          }
        ]
      }
    });
  }
}
