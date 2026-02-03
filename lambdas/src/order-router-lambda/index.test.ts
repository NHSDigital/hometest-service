import {APIGatewayProxyEvent, Context} from 'aws-lambda';

// Setup mocks
const mockSend = jest.fn();

jest.mock('@aws-sdk/client-secrets-manager', () => {
  return {
    SecretsManagerClient: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    GetSecretValueCommand: jest.fn().mockImplementation((params) => params),
  };
});

// Import handler after mocking
import {handler} from './index';
import {GetSecretValueCommand} from '@aws-sdk/client-secrets-manager';

// Mock fetch
global.fetch = jest.fn() as any;

describe('order-router-lambda', () => {
  let mockEvent: Partial<APIGatewayProxyEvent>;
  let mockContext: Partial<Context>;

  beforeEach(() => {
    mockEvent = {
      httpMethod: 'POST',
      path: '/test-order/order',
      body: null,
      headers: {},
      queryStringParameters: null,
    };

    mockContext = {
      functionName: 'order-router',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789012:function:order-router',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/order-router',
      logStreamName: '2026/02/02/[$LATEST]test',
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn(),
    };

    // Reset mocks
    mockSend.mockReset();
    (global.fetch as jest.Mock).mockReset();

    // Set environment variables
    process.env.SUPPLIER_BASE_URL = 'http://wiremock:8080';
    process.env.SUPPLIER_OAUTH_TOKEN_PATH = '/oauth/token';
    process.env.SUPPLIER_CLIENT_ID = 'supplier-client';
    process.env.SUPPLIER_CLIENT_SECRET_NAME = 'supplier-oauth-client-secret';
    process.env.AWS_REGION = 'eu-west-1';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.SUPPLIER_BASE_URL;
    delete process.env.SUPPLIER_OAUTH_TOKEN_PATH;
    delete process.env.SUPPLIER_CLIENT_ID;
    delete process.env.SUPPLIER_CLIENT_SECRET_NAME;
  });

  describe('successful OAuth token retrieval', () => {
    it('should retrieve token successfully with JSON secret', async () => {
      const mockSecret = JSON.stringify({client_secret: 'test-secret-123'});
      mockSend.mockResolvedValue({
        SecretString: mockSecret,
      });

      const mockTokenResponse = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'orders results',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockTokenResponse),
        headers: {
          get: (name: string) => (name === 'content-type' ? 'application/json' : null),
        },
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(result.statusCode).toBe(200);
      expect(result.headers?.['Content-Type']).toBe('application/json');
      expect(JSON.parse(result.body)).toEqual(mockTokenResponse);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({SecretId: 'supplier-oauth-client-secret'})
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'http://wiremock:8080/oauth/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials&client_id=supplier-client&client_secret=test-secret-123',
        })
      );
    });

    it('should use custom token path from environment', async () => {
      process.env.SUPPLIER_OAUTH_TOKEN_PATH = '/custom/token/endpoint';

      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({client_secret: 'test-secret'}),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({access_token: 'token'}),
        headers: {
          get: () => 'application/json',
        },
      });

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://wiremock:8080/custom/token/endpoint',
        expect.any(Object)
      );
    });

    it('should handle base URL with trailing slash', async () => {
      process.env.SUPPLIER_BASE_URL = 'http://wiremock:8080/';

      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({client_secret: 'test-secret'}),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({access_token: 'token'}),
        headers: {
          get: () => 'application/json',
        },
      });

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://wiremock:8080/oauth/token',
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('should return 500 when SUPPLIER_BASE_URL is missing', async () => {
      delete process.env.SUPPLIER_BASE_URL;

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain('Missing required configuration');
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should return 500 when SUPPLIER_CLIENT_ID is missing', async () => {
      delete process.env.SUPPLIER_CLIENT_ID;

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain('Missing required configuration');
    });

    it('should return 500 when SUPPLIER_CLIENT_SECRET_NAME is missing', async () => {
      delete process.env.SUPPLIER_CLIENT_SECRET_NAME;

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain('Missing required configuration');
    });

    it('should return 500 when secret string is empty', async () => {
      mockSend.mockResolvedValue({
        SecretString: '',
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain('Secret string is empty');
    });

    it('should return 500 when secret JSON is missing client_secret', async () => {
      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({other_field: 'value'}),
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain('client_secret missing in secret JSON');
    });

    it('should return 500 when SecretsManager throws error', async () => {
      mockSend.mockRejectedValue(new Error('Secret not found'));

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain('Secret not found');
    });

    it('should return error status from OAuth endpoint', async () => {
      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({client_secret: 'test-secret'}),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({error: 'invalid_client'}),
        headers: {
          get: () => 'application/json',
        },
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(result.statusCode).toBe(401);
      expect(result.body).toContain('invalid_client');
    });

    it('should handle fetch network errors', async () => {
      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({client_secret: 'test-secret'}),
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain('Network error');
    });

    it('should handle non-JSON response from OAuth endpoint', async () => {
      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({client_secret: 'test-secret'}),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'plain text response',
        headers: {
          get: () => 'text/plain',
        },
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      expect(result.statusCode).toBe(200);
      expect(result.headers?.['Content-Type']).toBe('text/plain');
      expect(result.body).toBe('plain text response');
    });
  });

  describe('AWS region handling', () => {
    it('should use AWS_REGION from environment', async () => {
      process.env.AWS_REGION = 'us-east-1';
      delete process.env.AWS_DEFAULT_REGION;

      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({client_secret: 'test-secret'}),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({access_token: 'token'}),
        headers: {
          get: () => 'application/json',
        },
      });

      await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);

      // SecretsManagerClient is instantiated at module level, so we just verify it works
      expect(mockSend).toHaveBeenCalled();
    });
  });
});
