import { APIGatewayProxyEvent, Context } from 'aws-lambda';

const mockSQSClientSendMessage = jest.fn();

jest.mock('../lib/sqs/sqs-client', () => ({
  AWSSQSClient: jest.fn().mockImplementation(() => ({
    sendMessage: mockSQSClientSendMessage,
    close: jest.fn(),
  })),
}));
// Silence validation errors from appearing on console output during tests
let mockCommonsLoggerError = jest.fn();
let mockCommonsLoggerInfo = jest.fn();

jest.mock('../lib/commons', () => ({
  ConsoleCommons: jest.fn().mockImplementation(() => ({
    logError: mockCommonsLoggerError,
    logInfo: mockCommonsLoggerInfo,
  })),
}));

process.env.RESULT_QUEUE_URL = 'https://sqs.eu-west-1./wiremock:8080/test-results-queue';
process.env.AWS_REGION = 'eu-west-1';
process.env.SQS_ENDPOINT = '"http://wiremock:8080"';

import { handler } from './index';

describe('Order Result Lambda Handler', () => {
  let mockEvent: Partial<APIGatewayProxyEvent>;
  let mockContext: Partial<Context>;
  let body;

  beforeEach(() => {
    mockEvent = {
      httpMethod: 'POST',
      path: "/result",
      body: null,
      headers: {},
    }

    body = {
          resourceType: 'Observation',
          identifier: '12345',
          status: 'final',
          basedOn: [
            {
              reference: 'ServiceRequest/12345',
            },
          ],
          subject: {
            reference: 'Patient/12345',
          },
          interpretation: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                  code: 'POS',
                  display: 'Positive',
                },
              ],
              text: 'POSITIVE',
            },
          ],
        };

    mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'order-result-lambda',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:eu-west-1:123456789:function:order-result-lambda',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/order-result-lambda',
      logStreamName: '2024/01/15/[$LATEST]test',
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn(),
    };

    mockSQSClientSendMessage.mockReset();
    mockCommonsLoggerError.mockReset();
    mockCommonsLoggerInfo.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Success scenarios', () => {
    test('should process valid result successfully', async () => {
      mockEvent.body = JSON.stringify(body);

      mockSQSClientSendMessage.mockResolvedValue({
        MessageId: 'test-message-id-123',
        SequenceNumber: '1',
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual(body);
      expect(mockSQSClientSendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation scenarios', () => {
    test('should fail validation when interpretation system is missing', async () => {
      body.interpretation[0].coding[0].system = undefined;
      mockEvent.body = JSON.stringify(body);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(mockCommonsLoggerError).toHaveBeenCalledTimes(1);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'invalid',
            diagnostics: expect.stringContaining('interpretation[0].coding[0].system'),
            severity: 'error',
          },
        ],
      });
    });

    test('should fail validation when interpretation code is missing', async () => {
      body.interpretation[0].coding[0].code = undefined;
      mockEvent.body = JSON.stringify(body);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(mockCommonsLoggerError).toHaveBeenCalledTimes(1);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'invalid',
            diagnostics: expect.stringContaining('interpretation[0].coding[0].code'),
            severity: 'error',
          },
        ],
      });
    });

    test('should fail validation when interpretation display is missing', async () => {
      body.interpretation[0].coding[0].display = undefined;
      mockEvent.body = JSON.stringify(body);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'invalid',
            diagnostics: 'Invalid input: expected string, received undefined → at interpretation[0].coding[0].display',
            severity: 'error',
          },
        ],
      });
    });

    test('should fail validation when interpretation coding is missing', async () => {
      body.interpretation[0].coding = undefined;
      mockEvent.body = JSON.stringify(body);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'invalid',
            diagnostics: 'Invalid input: expected array, received undefined → at interpretation[0].coding',
            severity: 'error',
          },
        ],
      });
    });

    test('should fail validation when interpretation is missing', async () => {
      body.interpretation = undefined;
      mockEvent.body = JSON.stringify(body);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'invalid',
            diagnostics: 'Invalid input: expected array, received undefined → at interpretation',
            severity: 'error',
          },
        ],
      });
    });

    test('should fail validation when subject reference is missing', async () => {
      body.subject.reference = undefined;
      mockEvent.body = JSON.stringify(body);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'invalid',
            diagnostics: 'Invalid input: expected string, received undefined → at subject.reference',
            severity: 'error',
          },
        ],
      });
    });

    test('should fail validation when subject is missing', async () => {
      body.subject = undefined;
      mockEvent.body = JSON.stringify(body);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'invalid',
            diagnostics: 'Invalid input: expected object, received undefined → at subject',
            severity: 'error',
          },
        ],
      });
    });

    test('should fail validation when basedOn reference is missing', async () => {
      body.basedOn[0].reference = undefined;
      mockEvent.body = JSON.stringify(body);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'invalid',
            diagnostics: 'Invalid input: expected string, received undefined → at basedOn[0].reference',
            severity: 'error',
          },
        ],
      });
    });

    test('should fail validation when basedOn is missing', async () => {
      body.basedOn = undefined;
      mockEvent.body = JSON.stringify(body);

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'invalid',
            diagnostics: 'Invalid input: expected array, received undefined → at basedOn',
            severity: 'error',
          },
        ],
      });
    });
  });

  describe('Invalid JSON scenarios', () => {
    test('should handle invalid JSON in request body', async () => {
      mockEvent.body = '{ invalid json body}';

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'invalid',
            diagnostics: 'Invalid JSON in request body',
            severity: 'error',
          },
        ],
      });
    });

    test('should handle empty JSON in request body', async () => {
      mockEvent.body = '{}';

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'invalid',
            diagnostics: 'Invalid JSON in request body',
            severity: 'error',
          },
        ],
      });
    });

    test('should handle null request body', async () => {
      mockEvent.body = null;

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'invalid',
            diagnostics: 'Invalid JSON in request body',
            severity: 'error',
          },
        ],
      });
    });
  });

  describe('SQS Client error scenarios', () => {

    beforeEach(() => {
      mockEvent.body = JSON.stringify(body);
    });

    test('should handle SQS internal server error', async () => {
      mockSQSClientSendMessage.mockRejectedValue({
        name: 'InternalFailure',
        message: 'Internal server error occurred',
        $metadata: {
          httpStatusCode: 500,
        },
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'exception',
            diagnostics: 'An internal error occurred',
            severity: 'fatal',
          },
        ],
      });
    });

    test('should handle SQS service unavailable error', async () => {
      mockSQSClientSendMessage.mockRejectedValue({
        name: 'ServiceUnavailable',
        message: 'Service temporarily unavailable',
        $metadata: {
          httpStatusCode: 503,
        },
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'exception',
            diagnostics: 'An internal error occurred',
            severity: 'fatal',
          },
        ],
      });
    });

    test('should handle SQS throttling error', async () => {
      mockSQSClientSendMessage.mockRejectedValue({
        name: 'ThrottlingException',
        message: 'The request was denied due to request throttling.',
        $metadata: {
          httpStatusCode: 403,
        },
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toMatchObject({
        issue: [
          {
            code: 'exception',
            diagnostics: 'An internal error occurred',
            severity: 'fatal',
          },
        ],
      });
    });
  });

  describe('Environment configuration', () => {
    test('should use configured queue URL from environment', async () => {
      mockEvent.body = JSON.stringify(body);
      mockSQSClientSendMessage.mockResolvedValue({
        MessageId: 'test-message-id-123',
        SequenceNumber: '1',
      });

      const result = await handler(mockEvent as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(201);
      expect(mockSQSClientSendMessage).toHaveBeenCalledTimes(1);
      expect(mockSQSClientSendMessage).toHaveBeenCalledWith(
        'https://sqs.eu-west-1./wiremock:8080/test-results-queue',
        expect.any(String),
        expect.any(Object),
      );
    });
  });
});
