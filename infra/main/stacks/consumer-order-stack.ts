import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import {BaseStack} from '../../common/base-stack'; // Adjust path as needed
import {NhcLambdaFactory} from '../../common/nhc-lambda-factory';

export class HomeTestServiceStack extends BaseStack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, 'local', '0.0.1');

    // 1. Initialize the Factory (assuming it needs context from the stack)
    const lambdaFactory = new NhcLambdaFactory(
      this,
      this.stackBaseName,
    );

    // 2. Create the Lambda using the factory pattern
    const eligibilityLambda = lambdaFactory.createFunction('EligibilityTestInfo', 'eligibility-test-info-lambda', {
      DATABASE_URL: 'postgresql://app_user:STRONG_APP_PASSWORD@postgres-db:5432/mydb?currentSchema=hometest',
      LA_LOOKUP_URL: 'http://localhost:4566',
    });

    // 3. Define the API Gateway
    const api = new apigateway.RestApi(this, 'HomeTestApi', {
      restApiName: 'Home Test Service',
      deployOptions: {stageName: 'local'}
    });

    const testOrder = api.root.addResource('test-order');
    const info = testOrder.addResource('info');
    info.addMethod('GET', new apigateway.LambdaIntegration(eligibilityLambda));
  }
}
