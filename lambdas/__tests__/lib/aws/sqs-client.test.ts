import { SQSClient } from '@aws-sdk/client-sqs';
import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import { SQSClientService } from '../../../src/lib/aws/sqs-client';

describe('SQS Client tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let sqsClientStub: Sinon.SinonStubbedInstance<SQSClient>;
  let service: SQSClientService;

  const messageId = '12345';
  const queueUrl = 'queueUrl';
  const payload = { param1: 'param value', param2: 'another value' };
  const messageGroupId = '123456';
  const messageDeduplicationId = '4321';
  const messageAttributes = {
    attribute: {
      DataType: 'String',
      StringValue: 'value'
    }
  };
  const expectedInput = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(payload)
  };
  const expectedExtendedInput = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(payload),
    MessageGroupId: messageGroupId,
    MessageDeduplicationId: messageDeduplicationId,
    MessageAttributes: messageAttributes
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    sqsClientStub = sandbox.createStubInstance(SQSClient);
    service = new SQSClientService(
      commonsStub as unknown as Commons,
      sqsClientStub as unknown as SQSClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('sendMessage method', () => {
    test('sends successfully sqs message', async () => {
      sqsClientStub.send.resolves({ MessageId: messageId });

      const result = await service.sendMessage(queueUrl, payload);

      expect(result).toEqual({ messageId });
      expect(sqsClientStub.send.getCall(0).args[0].input).toMatchObject(
        expectedInput
      );
    });

    test('sends successfully sqs message with optional parameters passed', async () => {
      sqsClientStub.send.resolves({ MessageId: messageId });

      const result = await service.sendMessage(
        queueUrl,
        payload,
        messageGroupId,
        messageDeduplicationId,
        messageAttributes
      );

      expect(result).toEqual({ messageId });
      expect(sqsClientStub.send.getCall(0).args[0].input).toMatchObject(
        expectedExtendedInput
      );
    });

    test('fails to send sqs message', async () => {
      const exception = new Error('Test error');

      sqsClientStub.send.throwsException(exception);

      await expect(service.sendMessage(queueUrl, payload)).rejects.toThrow(
        exception
      );
      expect(sqsClientStub.send.getCall(0).args[0].input).toMatchObject(
        expectedInput
      );
    });
  });
});
