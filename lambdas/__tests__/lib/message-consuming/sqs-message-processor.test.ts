import { type Commons } from '../../../src/lib/commons';
import Sinon from 'ts-sinon';
import { processSqsEvent } from '../../../src/lib/message-consuming/sqs-message-processor';
import { type SQSEvent } from 'aws-lambda';

describe('sqs-message-processor', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  const appendKeysStub: Sinon.SinonStub = sandbox.stub();
  const logErrorStub: Sinon.SinonStub = sandbox.stub();
  const commonsStub = {
    logger: {
      appendKeys: appendKeysStub
    },
    logInfo: sandbox.stub(),
    logDebug: sandbox.stub(),
    logError: logErrorStub
  } as unknown as Commons;
  const testStub: Sinon.SinonStub = sandbox.stub();

  const serviceClassName = 'sqs-message-processor';
  const allPropertiesEvent: SQSEvent = {
    Records: [
      {
        messageId: 'messageId1',
        body: JSON.stringify({
          correlationId: 'correlationId1',
          patientId: 'patientId1',
          healthCheckId: 'healthCheckId1',
          someOtherProp: 'value'
        }),
        attributes: {
          ApproximateReceiveCount: '1'
        }
      }
    ]
  } as unknown as SQSEvent;
  const somePropertiesEvent: SQSEvent = {
    Records: [
      {
        messageId: 'messageId2',
        body: JSON.stringify({
          correlationId: 'correlationId2'
        }),
        attributes: {
          ApproximateReceiveCount: '1'
        }
      }
    ]
  } as unknown as SQSEvent;

  afterEach(() => {
    sandbox.resetHistory();
    sandbox.reset();
  });

  describe('processSqsEvent', () => {
    it('should call passed method and appendkeys', async () => {
      testStub.resolves();
      const result = await processSqsEvent(
        allPropertiesEvent,
        commonsStub as unknown as Commons,
        testStub
      );

      expect(result).toMatchObject([]);
      sandbox.assert.calledWith(testStub, allPropertiesEvent.Records[0]);
      sandbox.assert.calledWith(appendKeysStub, {
        metadata: { healthCheckId: 'healthCheckId1' }
      });
      sandbox.assert.calledWith(appendKeysStub, {
        metadata: { patientId: 'patientId1' }
      });
    });

    it('should return id of message that failed processing', async () => {
      const error = new Error('fail');
      testStub.rejects(error);

      const result = await processSqsEvent(
        allPropertiesEvent,
        commonsStub as unknown as Commons,
        testStub
      );

      expect(result).toMatchObject([{ itemIdentifier: 'messageId1' }]);
      sandbox.assert.calledWith(testStub, allPropertiesEvent.Records[0]);
      Sinon.assert.calledWith(
        logErrorStub.getCall(0),
        serviceClassName,
        'Error consuming SQS message',
        {
          messageId: 'messageId1',
          correlationId: 'correlationId1',
          patientId: 'patientId1',
          healthCheckId: 'healthCheckId1',
          error
        }
      );
    });

    it('should correctly log error when not all properties are set', async () => {
      const error = new Error('fail');
      testStub.rejects(error);

      const result = await processSqsEvent(
        somePropertiesEvent,
        commonsStub as unknown as Commons,
        testStub
      );

      expect(result).toMatchObject([{ itemIdentifier: 'messageId2' }]);
      sandbox.assert.calledWith(testStub, somePropertiesEvent.Records[0]);
      Sinon.assert.calledWith(
        logErrorStub.getCall(0),
        serviceClassName,
        'Error consuming SQS message',
        {
          messageId: 'messageId2',
          correlationId: 'correlationId2',
          error
        }
      );
      sandbox.assert.notCalled(appendKeysStub);
    });
  });
});
