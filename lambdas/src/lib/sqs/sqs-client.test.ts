import { AWSSQSClient } from './sqs-client';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

jest.mock('@aws-sdk/client-sqs');

describe('AWSSQSClient', () => {
  let sqsClient: AWSSQSClient;
  const mockSend = jest.fn();
  const queueUrl = 'https://sqs.eu-west-1./wiremock:8080/test-results-queue';
  const messageBody = 'Test message';

  beforeEach(() => {
    (SQSClient as jest.Mock).mockImplementation(() => {
      return {
        send: mockSend,
        destroy: jest.fn(),
      };
    });
    sqsClient = new AWSSQSClient();
    mockSend.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should send message successfully', async () => {
    mockSend.mockResolvedValueOnce({ MessageId: '123', SequenceNumber: '456' });

    const result = await sqsClient.sendMessage(queueUrl, messageBody);

    expect(result).toEqual({ messageId: '123', sequenceNumber: '456' });
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(expect.any(SendMessageCommand));
  });

  test('should propagate internal failure from AWS', async () => {
    mockSend.mockRejectedValueOnce(new Error('InternalFailure'));

    await expect(sqsClient.sendMessage(queueUrl, messageBody)).rejects.toThrow('InternalFailure');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test('should propagate service unavailable', async () => {
    mockSend.mockRejectedValueOnce(new Error('ServiceUnavailable'));

    await expect(sqsClient.sendMessage(queueUrl, messageBody)).rejects.toThrow('ServiceUnavailable');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test('should propagate throttling exception', async () => {
    mockSend.mockRejectedValueOnce(new Error('Throttling Exception'));

    await expect(sqsClient.sendMessage(queueUrl, messageBody)).rejects.toThrow('Throttling Exception');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
