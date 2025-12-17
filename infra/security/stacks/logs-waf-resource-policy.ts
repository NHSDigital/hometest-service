/* eslint-disable no-new */
// Create Resource policy only ONCE per region
import { type Construct } from 'constructs';
import {
  Stack,
  ArnFormat,
  aws_iam as iam,
  aws_logs as logs,
  RemovalPolicy
} from 'aws-cdk-lib';
import {
  SharedBaseStack,
  type NhcSharedStackProps
} from './common/shared-Base-Stack';

export class NhcLogsWAFResourcePolicyStack extends SharedBaseStack {
  constructor(
    scope: Construct,
    id: string,
    props: NhcSharedStackProps,
    version: string
  ) {
    super(scope, id, props.envVariables.common.envName, version, props);

    const policy = new logs.ResourcePolicy(
      this,
      `${id}-waf-resource-policy-${Stack.of(this).region}-${version}`,
      {
        policyStatements: [
          new iam.PolicyStatement({
            actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            resources: [
              Stack.of(this).formatArn({
                arnFormat: ArnFormat.COLON_RESOURCE_NAME,
                service: 'logs',
                resource: 'log-group',
                resourceName: 'aws-waf-logs-*'
              })
            ],
            principals: [
              new iam.ServicePrincipal('delivery.logs.amazonaws.com')
            ],
            conditions: {
              StringEquals: {
                'aws:SourceAccount': [Stack.of(this).account]
              },
              ArnLike: {
                'aws:SourceArn': [
                  `arn:aws:logs:${Stack.of(this).region}:${Stack.of(this).account}:*`
                ]
              }
            },
            effect: iam.Effect.ALLOW
          })
        ]
      }
    );
    policy.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
