jest.mock('../lib/utils');
jest.mock('../lib/postcode-lookup/postcode-lookup-service');
jest.mock('./init');

import { APIGatewayProxyEvent } from 'aws-lambda';
import { lambdaHandler } from './index';
import * as utils from '../lib/utils';
import { PostcodeLookupService } from '../lib/postcode-lookup/postcode-lookup-service';
import { init } from './init';

const mockRetrieveMandatoryEnvVariable = utils.retrieveMandatoryEnvVariable as jest.MockedFunction<typeof utils.retrieveMandatoryEnvVariable>;
const mockRetrieveOptionalEnvVariable = utils.retrieveOptionalEnvVariable as jest.MockedFunction<typeof utils.retrieveOptionalEnvVariable>;
const MockPostcodeLookupService = PostcodeLookupService as jest.MockedClass<typeof PostcodeLookupService>;
const mockInit = init as jest.MockedFunction<typeof init>;

describe('postcode-lookup-lambda handler', () => {
  const mockPerformLookup = jest.fn();
  const mockServiceInstance = {
    performLookup: mockPerformLookup,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockRetrieveMandatoryEnvVariable.mockImplementation((key: string) => {
      const mockEnvVars: Record<string, string> = {
        'POSTCODE_LOOKUP_CREDENTIALS_SECRET_NAME': 'test-secret',
        'POSTCODE_LOOKUP_BASE_URL': 'https://test.example.com',
      };
      return mockEnvVars[key] || 'mock-value';
    });

    mockRetrieveOptionalEnvVariable.mockImplementation((key: string) => {
      const mockEnvVars: Record<string, string> = {
        'USE_STUB_POSTCODE_CLIENT': 'true',
      };
      return mockEnvVars[key];
    });

    mockInit.mockResolvedValue({
      postcodeLookupService: mockServiceInstance as any,
    });
  });

  it('should return 400 when postcode query parameter is missing', async () => {
    const event = {
      queryStringParameters: {},
    } as Partial<APIGatewayProxyEvent> as APIGatewayProxyEvent;

    const result = await lambdaHandler(event);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe('Invalid request, missing parameters');
    expect(mockPerformLookup).not.toHaveBeenCalled();
  });

  it('should return 400 when queryStringParameters is null', async () => {
    const event = {
      queryStringParameters: null,
    } as Partial<APIGatewayProxyEvent> as APIGatewayProxyEvent;

    const result = await lambdaHandler(event);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe('Invalid request, missing parameters');
    expect(mockPerformLookup).not.toHaveBeenCalled();
  });

  it('should return 200 with lookup results when postcode is valid', async () => {
    const mockResponse = {
      postcode: 'SW1A 1AA',
      addresses: [
        {
          line1: 'Prime Minister & First Lord Of The Treasury',
          line2: '10 Downing Street',
          town: 'London',
          postcode: 'SW1A 1AA',
        },
      ],
      status: 'found',
    };
    mockPerformLookup.mockResolvedValue(mockResponse);

    const event = {
      queryStringParameters: { postcode: 'SW1A 1AA' },
    } as Partial<APIGatewayProxyEvent> as APIGatewayProxyEvent;

    const result = await lambdaHandler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(mockResponse);
    expect(mockPerformLookup).toHaveBeenCalledWith('SW1A 1AA');
  });

  it('should log error details and rethrow when service throws error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockError = {
      cause: {
        details: {
          responseData: { error: 'Service unavailable' },
        },
      },
    };
    mockPerformLookup.mockRejectedValue(mockError);

    const event = {
      queryStringParameters: { postcode: 'INVALID' },
    } as Partial<APIGatewayProxyEvent> as APIGatewayProxyEvent;

    await expect(lambdaHandler(event)).rejects.toEqual(mockError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'handler - Error in postcode lookup handler:',
      { error: 'Service unavailable' }
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle errors without cause details', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockError = new Error('Generic error');
    mockPerformLookup.mockRejectedValue(mockError);

    const event = {
      queryStringParameters: { postcode: 'SW1A 1AA' },
    } as Partial<APIGatewayProxyEvent> as APIGatewayProxyEvent;

    await expect(lambdaHandler(event)).rejects.toEqual(mockError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'handler - Error in postcode lookup handler:',
      undefined
    );

    consoleErrorSpy.mockRestore();
  });
});
