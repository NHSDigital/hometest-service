import { SNSClient } from '@aws-sdk/client-sns';
import Sinon from 'sinon';
import { SNSClientService } from '../../../src/lib/aws/sns-client';
import { Commons } from '../../../src/lib/commons';

describe('SNS Client', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let snsClient: Sinon.SinonStubbedInstance<SNSClient>;
  let snsClientService: SNSClientService;

  const message = {
    version: '1.0',
    source: 'custom',
    content: {
      textType: 'client-markdown',
      title: 'Test Title',
      description: 'Test Description'
    },
    metadata: {
      enableCustomActions: false
    }
  };

  const stringMessage = JSON.stringify(message);

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    snsClient = sandbox.createStubInstance(SNSClient);
    snsClientService = new SNSClientService(
      commonsStub as unknown as Commons,
      snsClient as unknown as SNSClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });
  it('should send a message to the SNS topic', async () => {
    snsClient.send.resolves({ MessageId: '12345' });

    const result = await snsClientService.sendSNSMessage(
      stringMessage,
      'test-topic-arn'
    );

    expect(result).toEqual({ messageId: '12345' });
  });

  it('should log an error if sending the message fails', async () => {
    const error = new Error('SNS send failed');
    snsClient.send.rejects(error);

    await expect(
      snsClientService.sendSNSMessage(stringMessage, 'test-topic-arn')
    ).rejects.toThrow('SNS send failed');
  });
});
