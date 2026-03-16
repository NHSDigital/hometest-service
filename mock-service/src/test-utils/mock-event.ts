import { APIGatewayProxyEvent } from "aws-lambda";

/**
 * Creates a minimal APIGatewayProxyEvent for testing.
 */
export const mockEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent => ({
  httpMethod: "GET",
  path: "/",
  body: null,
  headers: {},
  multiValueHeaders: {},
  isBase64Encoded: false,
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {
    accountId: "123456789012",
    apiId: "mock-api",
    authorizer: null,
    protocol: "HTTP/1.1",
    httpMethod: "GET",
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      clientCert: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: "127.0.0.1",
      user: null,
      userAgent: "jest-test",
      userArn: null,
    },
    path: "/",
    stage: "test",
    requestId: "mock-request-id",
    requestTimeEpoch: Date.now(),
    resourceId: "mock",
    resourcePath: "/",
  },
  resource: "/",
  ...overrides,
});
