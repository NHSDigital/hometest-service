import * as cdk from 'aws-cdk-lib';
import { HomeTestServiceStack } from './stacks/consumer-order-stack';

const app = new cdk.App();

// In a real scenario, you'd pull environment config here
new HomeTestServiceStack(app, 'consumer-order-stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'eu-west-1'
  },
});
