import { type Construct } from 'constructs';
import { BaseStack, addEnvPrefixToPhysicalId } from '../../common/base-stack';
import { CfnOutput, type StackProps } from 'aws-cdk-lib';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as fs from 'fs';
import * as path from 'path';
import { ResourceNamingService } from '../../common/resource-naming-service';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { NhcBucketFactory } from '../../common/nhc-bucket-factory';
import { NhcLambdaFactory } from '../../common/nhc-lambda-factory';
import { type NHCEnvVariables } from '../settings';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { type NhsAlarmFactory } from '../../common/nhc-alarm-factory';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGateway } from 'aws-cdk-lib/aws-route53-targets';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';

interface NhcMocksStackProps extends StackProps {
  envVariables: NHCEnvVariables;
  alarmFactory: NhsAlarmFactory;
}

export class NhcMocksStack extends BaseStack {
  public readonly labOrderPlacementEndpointUrl: string;
  public readonly thrivaLabOrderPlacementEndpointUrl: string;
  public readonly thrivaLabAuthEndpointUrl: string;
  public readonly labOrderPlacementEndpointApiKey: string;
  public readonly osPlacesApiEndpointUrl: string;
  public readonly osPlacesApiKey: string;
  public readonly riskScoresEndpointUrl: string;
  public readonly riskScoresApiKey: string;
  public readonly nhsLoginEndpointUrl: string;
  public readonly emisTransactionApiEndpointUrl: string;
  public readonly nhsPlatformApiAuthEndpointUrl: string;
  public readonly notifyApiEndpointUrl: string;
  public readonly mnsApiEndpointUrl: string;
  public readonly pdmApiEndpointUrl: string;
  public readonly perfApiEndpoint: string;

  constructor(scope: Construct, id: string, props: NhcMocksStackProps) {
    super(
      scope,
      id,
      props.envVariables.common.envName,
      props.envVariables.nhcVersion
    );
    const namingService = new ResourceNamingService(
      props.envVariables.common.envName
    );

    const lambdaFactory = new NhcLambdaFactory(
      this,
      this.stackBaseName,
      props.envVariables,
      props.alarmFactory,
      false,
      false,
      'nhc-mock'
    );
    const domainName = 'dhctest.org';
    const apiDomain = `${this.envName}-mock-api.dhctest.org`;
    const cert = Certificate.fromCertificateArn(
      this,
      'test-nhc-cert',
      'arn:aws:acm:eu-west-2:880521146064:certificate/5a25973e-410c-4f25-b9cf-3eeb091a00b5'
    );
    const kmsKey = this.getKmsKeyById(
      props.envVariables.aws.managementAccountId,
      props.envVariables.security.kmsKeyId
    );
    const logGroup = new LogGroup(this, 'mocks-api-gateway-logs', {
      logGroupName:
        namingService.getEnvSpecificResourceName('api-gateway-logs'),
      removalPolicy: props.envVariables.awsResourcesRemovalPolicy,
      retention: props.envVariables.logRetention || RetentionDays.INFINITE,
      encryptionKey: kmsKey
    });
    const api = new RestApi(this, 'nhc-mocks-api', {
      restApiName: addEnvPrefixToPhysicalId(this.envName, 'nhc-mocks-api'),
      cloudWatchRole: false,
      disableExecuteApiEndpoint: !props.envVariables.executeApiEndpointEnabled,
      description: 'mock api gateway for nhc project',
      deployOptions: {
        stageName: 'dev',
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup)
      },
      domainName: {
        domainName: apiDomain,
        certificate: cert
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL]
      },
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.NONE
      }
    });

    /* To be disabled until VPC Infrastructure in place - see DNHC-971
    new wafv2.CfnWebACLAssociation(this, 'BackendAPIGWRegionalWafAssociation', {
      resourceArn: api.deploymentStage.stageArn,
      webAclArn: cdk.Fn.importValue('RegionalAPIGWWafARN')
    });
    End region DNHC-971 */

    const { thrivaAuthApi, thrivaOrderApi } = this.configureThrivaMocks(
      api,
      lambdaFactory,
      props
    );

    this.thrivaLabAuthEndpointUrl = api.urlForPath(thrivaAuthApi.path);

    this.thrivaLabOrderPlacementEndpointUrl = api.urlForPath(
      thrivaOrderApi.path
    );

    const osPlacesApi = this.configureAddressLookupMock(api);
    this.osPlacesApiEndpointUrl = api.urlForPath(osPlacesApi.path);
    this.osPlacesApiKey = 'test-api-key';

    const riskScoresApi = this.configureRiskScoresMocks(api);
    this.riskScoresEndpointUrl = api.urlForPath(riskScoresApi.path);
    this.riskScoresApiKey = 'test-api-key';

    const emisMockApi = this.configureEmisMock(api, lambdaFactory);
    this.emisTransactionApiEndpointUrl = api.urlForPath(emisMockApi.path);

    const nhsLoginMockApi = this.configureNhsLoginMock(
      api,
      lambdaFactory,
      props
    );
    this.nhsLoginEndpointUrl = api.urlForPath(nhsLoginMockApi.path);

    // NHS API Platform is the base for notify and pdm (and authentication for both)
    const nhsApiPlatformMockApi = api.root.addResource('nhs-api-platform');

    // auth
    const nhsApiPlatformAuthApi = this.configureNhsPlatformAuthApiMock(
      nhsApiPlatformMockApi
    );
    this.nhsPlatformApiAuthEndpointUrl = api.urlForPath(
      nhsApiPlatformAuthApi.path
    );

    // mns
    const mnsApi = this.configureMNSApi(nhsApiPlatformMockApi, lambdaFactory);
    this.mnsApiEndpointUrl = api.urlForPath(mnsApi.path);

    // notify
    const notifyApi = this.configureNhsNotifyMock(
      nhsApiPlatformMockApi,
      lambdaFactory
    );
    this.notifyApiEndpointUrl = api.urlForPath(notifyApi.path);

    // pdm
    const pdmApi = this.configurePdmApiMock(
      nhsApiPlatformMockApi,
      lambdaFactory
    );
    this.pdmApiEndpointUrl = api.urlForPath(pdmApi.path);

    // perf
    const perfApi = this.configurePerfApi(api, lambdaFactory);
    this.perfApiEndpoint = api.urlForPath(perfApi.path);

    // static resources
    this.configureTestPageMocks(api);

    // NHS App
    this.configureNhsAppRedirectorMock(api, lambdaFactory);

    new CfnOutput(this, 'MockApiBaseUrl', {
      value: api.url
    });

    this.createRoute53RecordInCurrentAccount(
      domainName,

      apiDomain,
      api
    );
  }

  private createRoute53RecordInCurrentAccount(
    domainName: string,
    apiDomain: string,
    api: RestApi
  ): void {
    const hostedZone = HostedZone.fromHostedZoneAttributes(
      this,
      'hosted-zone',
      {
        hostedZoneId: 'Z0048795829426HSWOM8',
        zoneName: domainName
      }
    );

    new ARecord(this, 'Alias', {
      recordName: apiDomain,
      zone: hostedZone,
      target: RecordTarget.fromAlias(new ApiGateway(api))
    });
  }

  private configureNhsLoginMock(
    api: RestApi,
    lambdaFactory: NhcLambdaFactory,
    props: NhcMocksStackProps
  ): apigateway.Resource {
    const nhsLoginMockApi = api.root.addResource('nhs-login');

    // jwks endpoint mock
    const wellKnownResource = nhsLoginMockApi.addResource('.well-known');
    const jwksResource = wellKnownResource.addResource('jwks.json');

    jwksResource.addMethod(
      'GET',
      new apigateway.MockIntegration({
        requestTemplates: {
          'application/json': '{ "statusCode": 200 }'
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json':
                '{ "keys": [{ "alg": "RS512", "kty": "RSA", "n": "ik1HnS3BwZ-kUOd-VEfcsu-mvhbDJDW9lEzEk_rlMBR223mSyd1e90wZ9i5L__n4IVV-R7WWRq7EF17FWetXNSBlCiAed20nIBSmwvSFHGjB8GtYAsZwNDCn_domO-6Hiv6qmir4Ep_s0ZuaoqBN1RDtXwsNq-6mbRkuLECAVW5EIrmBTlQzzx8zmY8G0hXd9-1bz1EImx1lyRYh9MNnLJ1xKxsqC3OS3AIorVJdpjV9XmwAP1uHMy7Z0cvk89RSUa05OljZrwYQBaQRsErB-N2BA2LqqrkNaNA7-wNGvBG9VlzbhTRVpfmZfRl9coj0_oG638Ajr-x6vURdq2OYzw", "e": "AQAB", "kid": "mock_public_kid" }]}'
            }
          }
        ]
      }),
      {
        methodResponses: [
          {
            statusCode: '200'
          }
        ]
      }
    );

    // token endpoint mock
    const tokenLambda = lambdaFactory.createLambda({
      name: 'nhs-login-token-lambda'
    });

    const nhsLoginMockPrivateKeySecret = Secret.fromSecretNameV2(
      this,
      `nhs-login-mock-private-key`,
      `nhc/mock/nhs-login-mock-private-key`
    );
    nhsLoginMockPrivateKeySecret.grantRead(tokenLambda);

    const tokenResource = nhsLoginMockApi.addResource('token');
    tokenResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(tokenLambda)
    );

    // userinfo endpoint mock
    const { testDataBucket } = this.configureTestDataBucket(props);
    const userInfoLambda = lambdaFactory.createLambda({
      name: 'nhs-login-userinfo-lambda',
      environment: {
        TEST_SCENARIO_BUCKET_NAME: testDataBucket.bucketName,
        TEST_SCENARIO_FOLDER_NAME: props.envVariables.testScenarioFolder
      }
    });
    const userInfoResource = nhsLoginMockApi.addResource('userinfo');
    userInfoResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(userInfoLambda)
    );
    testDataBucket.grantRead(userInfoLambda);

    // authorize endpoint mock
    const authorizeLambda = lambdaFactory.createLambda({
      name: 'nhs-login-authorize-lambda'
    });
    const authorizeResource = nhsLoginMockApi.addResource('authorize');
    authorizeResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(authorizeLambda)
    );

    // start page for testing
    const testScenariosPageLambda = lambdaFactory.createLambda({
      name: 'test-scenarios-page-lambda',
      environment: {
        TEST_SCENARIO_BUCKET_NAME: testDataBucket.bucketName,
        TEST_SCENARIO_FOLDER_NAME: props.envVariables.testScenarioFolder
      }
    });
    testDataBucket.grantRead(testScenariosPageLambda);
    const startPageResource = nhsLoginMockApi.addResource('start');
    startPageResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(testScenariosPageLambda)
    );

    return nhsLoginMockApi;
  }

  private configureTestDataBucket(props: NhcMocksStackProps): any {
    const bucketName = `${this.account}-${this.envName}-nhc-test-data-bucket`;
    const testDataBucket = new NhcBucketFactory().create({
      scope: this,
      id: 'nhc-test-data-bucket',
      bucketName,
      accessLoggingBucketName: props.envVariables.accessLoggingBucketName,
      envType: props.envVariables.envType,
      accountNumber: this.account,
      removalPolicy: props.envVariables.awsResourcesRemovalPolicy
    });

    const testDataDeploymentName = `${this.envName}-test-data-deployment`;
    const bucketDeployment = new s3deploy.BucketDeployment(
      this,
      testDataDeploymentName,
      {
        sources: [
          s3deploy.Source.asset(path.join(__dirname, './../../../data/mocks'))
        ],
        destinationBucket: testDataBucket
      }
    );

    return { testDataBucket, bucketDeployment };
  }

  private configureThrivaMocks(
    api: RestApi,
    lambdaFactory: NhcLambdaFactory,
    props: NhcMocksStackProps
  ): {
    thrivaAuthApi: apigateway.Resource;
    thrivaOrderApi: apigateway.Resource;
  } {
    const thrivaApi = api.root.addResource('lab').addResource('thriva');
    const thrivaAuthApi = this.configureThrivaLabAuthMocks(
      thrivaApi,
      lambdaFactory
    );
    const thrivaOrderApi = this.configureThrivaLabOrderPlacementMocks(
      thrivaApi,
      lambdaFactory,
      props
    );

    return { thrivaAuthApi, thrivaOrderApi };
  }

  private configureThrivaLabOrderPlacementMocks(
    thrivaResource: apigateway.Resource,
    lambdaFactory: NhcLambdaFactory,
    props: NhcMocksStackProps
  ): apigateway.Resource {
    const thrivaOrderPlacementLambda = lambdaFactory.createLambda({
      name: 'lab-thriva-order-placement-lambda',
      environment: {
        ADDRESS_TEXT_INPUT_MAX_LENGTH:
          props.envVariables.addressTextInputMaxLength
      }
    });
    const thrivaOrderApi = thrivaResource
      .addResource('dhc')
      .addResource('orders');
    thrivaOrderApi.addMethod(
      'POST',
      new apigateway.LambdaIntegration(thrivaOrderPlacementLambda)
    );
    return thrivaOrderApi;
  }

  private configureThrivaLabAuthMocks(
    thrivaResource: apigateway.Resource,
    lambdaFactory: NhcLambdaFactory
  ): apigateway.Resource {
    const thrivaAuthApi = thrivaResource
      .addResource('oauth')
      .addResource('token');

    const thrivaAuthenticationLambda = lambdaFactory.createLambda({
      name: 'lab-thriva-authentication-lambda'
    });

    thrivaAuthApi.addMethod(
      'POST',
      new apigateway.LambdaIntegration(thrivaAuthenticationLambda)
    );
    return thrivaAuthApi;
  }

  private configureAddressLookupMock(api: RestApi): apigateway.Resource {
    const addressMockResponse = fs.readFileSync(
      path.join(__dirname, '../mock-templates/address-mock-response.json'),
      'utf8'
    );

    const addressApi = api.root.addResource('address');
    this.addMockEndpointToApi(
      addressApi,
      'postcode',
      addressMockResponse,
      'GET'
    );
    return addressApi;
  }

  private configureRiskScoresMocks(api: RestApi): apigateway.Resource {
    const qriskMockResponse = fs.readFileSync(
      path.join(__dirname, '../mock-templates/qrisk-calc-mock-response.json'),
      'utf8'
    );

    const riskApis = api.root.addResource('riskScores');
    this.addMockEndpointToApi(
      riskApis,
      'Prediction',
      qriskMockResponse,
      'POST'
    );

    return riskApis;
  }

  private configureTestPageMocks(api: RestApi): apigateway.Resource {
    const cssStaticPage = fs.readFileSync(
      path.join(__dirname, '../test-page/static-resources/main.min.css'),
      'utf8'
    );

    const staticResources = api.root.addResource('static');
    this.addMockEndpointToApi(
      staticResources,
      'main.min.css',
      cssStaticPage,
      'GET',
      'text/css'
    );

    return staticResources;
  }

  private configureEmisMock(
    api: RestApi,
    lambdaFactory: NhcLambdaFactory
  ): apigateway.Resource {
    const emisMockApi = api.root.addResource('emis-transaction-api');
    const emisMockTransactionApiLambda = lambdaFactory.createLambda({
      name: 'emis-transaction-api-lambda',
      environment: {
        FILE_RECORD_HTTP_500_ERROR_PATIENTS: JSON.stringify([
          '9835043108', // onboarding.nhsapp+dhc.p9user10@gmail.com,
          '0130000002' // generated mock user
        ]),
        FILE_RECORD_HTTP_200_ERROR_PATIENTS: JSON.stringify([
          '9798835298', // onboarding.nhsapp+dhc.p9user8@gmail.com
          '0130000003'
        ]),
        GET_ACTIVE_USERS_HTTP_500_ERROR_USERS: JSON.stringify([
          'DNHSHC_mock_emis_err_500_code',
          'DNHSHC_C83615'
        ]),
        GET_ACTIVE_USERS_HTTP_200_ERROR_USERS: JSON.stringify([
          'DNHSHC_mock_emis_err_200_code',
          'DNHSHC_A20047'
        ])
      }
    });
    emisMockApi.addMethod(
      'POST',
      new apigateway.LambdaIntegration(emisMockTransactionApiLambda)
    );

    return emisMockApi;
  }

  private configureNhsNotifyMock(
    api: apigateway.Resource,
    lambdaFactory: NhcLambdaFactory
  ): apigateway.Resource {
    const messagesLambda = lambdaFactory.createLambda({
      name: 'nhs-notify-messages-lambda'
    });

    const notifyApi = api
      .addResource('comms')
      .addResource('v1')
      .addResource('messages');

    notifyApi.addMethod(
      'POST',
      new apigateway.LambdaIntegration(messagesLambda)
    );

    return notifyApi;
  }

  private configureNhsPlatformAuthApiMock(
    nhsPlatformApiResource: apigateway.Resource
  ): apigateway.Resource {
    const nhaPlatformAuthApi = nhsPlatformApiResource
      .addResource('oauth2')
      .addResource('token');

    nhaPlatformAuthApi.addMethod(
      'POST',
      new apigateway.MockIntegration({
        requestTemplates: {
          'application/x-www-form-urlencoded': '{ "statusCode": 200 }'
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json':
                '{ "access_token": "mock_value", "expires_in": "180" }'
            }
          }
        ]
      }),
      {
        methodResponses: [
          {
            statusCode: '200'
          }
        ]
      }
    );

    return nhaPlatformAuthApi;
  }

  private configurePdmApiMock(
    pdmResource: apigateway.Resource,
    lambdaFactory: NhcLambdaFactory
  ): apigateway.Resource {
    const pdmIntegrationLambda = lambdaFactory.createLambda({
      name: 'pdm-integration-lambda',
      additionalProps: {
        bundling: {
          commandHooks: {
            beforeBundling(inputDir: string, outputDir: string): string[] {
              const responseTemplatesDir = path.join(
                inputDir,
                'src/nhc-mocks-stack/pdm-integration-lambda/scenarios'
              );

              return [`cp -r ${responseTemplatesDir} ${outputDir}`];
            },
            afterBundling(): string[] {
              return [''];
            },
            beforeInstall(): string[] {
              return [''];
            }
          }
        }
      }
    });

    const pdmApi = pdmResource
      .addResource('patient-data-manager')
      .addResource('FHIR')
      .addResource('R4');

    pdmApi.addMethod(
      'POST',
      new apigateway.LambdaIntegration(pdmIntegrationLambda)
    );

    const resourceIdPath = pdmApi
      .addResource('{resource}')
      .addResource('{resourceId}');

    resourceIdPath.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(pdmIntegrationLambda)
    );

    resourceIdPath.addMethod(
      'GET',
      new apigateway.LambdaIntegration(pdmIntegrationLambda)
    );

    return pdmApi;
  }

  private addMockEndpointToApi(
    api: apigateway.Resource,
    resourceName: string,
    mockResponse: string,
    httpMethod: string,
    responseType: string = 'application/json'
  ): apigateway.Resource {
    const endpoint = api.addResource(resourceName);
    const responseTemplates: any = {};
    responseTemplates[responseType] = mockResponse;
    endpoint.addMethod(
      httpMethod,
      new apigateway.MockIntegration({
        requestTemplates: {
          'application/json': '{ "statusCode": 200 }'
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates,
            responseParameters: {
              'method.response.header.Content-Type': `'${responseType}'`
            }
          }
        ]
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': true
            }
          }
        ]
      }
    );
    return endpoint;
  }

  private configurePerfApi(
    api: RestApi,
    lambdaFactory: NhcLambdaFactory
  ): apigateway.Resource {
    const perf = api.root.addResource('perf');
    const healthcheck = perf.addResource('healthcheck');
    const healthCheckId = healthcheck.addResource('{healthCheckId}');
    const order = healthCheckId.addResource('order');
    const healthCheckOrderLambda = lambdaFactory.createLambda({
      name: 'nhs-healthcheck-order-lambda'
    });

    const region = cdk.Stack.of(this).region;
    const accountId = cdk.Stack.of(this).account;

    healthCheckOrderLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['dynamodb:Query'],
        resources: [
          `arn:aws:dynamodb:${region}:${accountId}:table/${this.envName}-nhc-order-db`,
          `arn:aws:dynamodb:${region}:${accountId}:table/${this.envName}-nhc-order-db/index/healthCheckIdIndex`
        ]
      })
    );

    const getOrderIntegration = new apigateway.LambdaIntegration(
      healthCheckOrderLambda
    );
    order.addMethod('GET', getOrderIntegration);

    return perf;
  }

  private configureNhsAppRedirectorMock(
    api: RestApi,
    lambdaFactory: NhcLambdaFactory
  ): apigateway.Resource {
    const nhsAppRoot = api.root.addResource('nhs-app');
    const redirectorLambda = lambdaFactory.createLambda({
      name: 'nhs-app-redirector-lambda',
      environment: {
        ENV_NAME: this.envName
      }
    });
    const redirector = nhsAppRoot.addResource('redirector');
    redirector.addMethod(
      'GET',
      new apigateway.LambdaIntegration(redirectorLambda)
    );
    return redirector;
  }

  private configureMNSApi(
    nhsApiPlatformResource: apigateway.Resource,
    lambdaFactory: NhcLambdaFactory
  ): apigateway.Resource {
    const mnsApi = nhsApiPlatformResource.addResource(
      'multicast-notification-service'
    );

    // creating the event
    const mnsEventLambda = lambdaFactory.createLambda({
      name: 'mns-event-lambda'
    });

    const region = cdk.Stack.of(this).region;
    const accountId = cdk.Stack.of(this).account;

    mnsEventLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['sqs:SendMessage'],
        resources: [
          `arn:aws:sqs:${region}:${accountId}:${this.envName}NhcMnsInbound`
        ]
      })
    );

    const mnsEncryptionKey = this.lookupKmsKeyByAlias('alias/mnsEncryptionKey');

    mnsEventLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['kms:GenerateDataKey*'],
        resources: [mnsEncryptionKey.keyArn]
      })
    );

    mnsApi
      .addResource('events')
      .addMethod('POST', new apigateway.LambdaIntegration(mnsEventLambda));

    return mnsApi;
  }
}
