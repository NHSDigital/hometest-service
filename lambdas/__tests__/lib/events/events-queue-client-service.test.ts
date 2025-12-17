import { Commons } from '../../../src/lib/commons';
import Sinon from 'ts-sinon';
import { EventsQueueClientService } from '../../../src/lib/events/events-queue-client-service';
import { AuditEventType } from '@dnhc-health-checks/shared';
import {
  type ISQSClientResponse,
  SQSClientService
} from '../../../src/lib/aws/sqs-client';
import { UserSource } from '../../../src/lib/models/session/session';

const mockDate = new Date();
jest.useFakeTimers().setSystemTime(mockDate);

describe('EventsQueueClientService tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  const eventsQueueUrl: string = 'Queue Url';
  const messageResult = { messageId: '12345' };
  const sourceApp = UserSource.NHSApp;
  const auditEvent = {
    id: 'demks',
    healthCheckId: 'abcde',
    nhsNumber: '0123456789',
    odsCode: 'hejsowh35',
    nhcVersion: '456',
    eventType: AuditEventType.HealthCheckCreated
  };
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let sqsClientStub: Sinon.SinonStubbedInstance<SQSClientService>;

  let service: EventsQueueClientService;

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    sqsClientStub = sandbox.createStubInstance(SQSClientService);

    service = new EventsQueueClientService(
      commonsStub as unknown as Commons,
      eventsQueueUrl,
      sqsClientStub
    );

    service.source = sourceApp;
  });

  afterEach(() => {
    sandbox.reset();
    sandbox.resetHistory();
  });

  describe('createEvent method tests', () => {
    test('should return messageId', async () => {
      sqsClientStub.sendMessage.resolves(messageResult);

      const result = await service.createEvent(auditEvent);

      expect(result).toEqual({
        messageId: messageResult.messageId
      });
      expect(
        sqsClientStub.sendMessage.calledOnceWithExactly(eventsQueueUrl, {
          source: sourceApp,
          ...auditEvent,
          datetime: mockDate.toISOString()
        })
      ).toBeTruthy();
    });

    test('should return empty string if sqs client returns empty messageId', async () => {
      sqsClientStub.sendMessage.resolves({} as unknown as ISQSClientResponse);

      const result = await service.createEvent(auditEvent);

      expect(result).toEqual({
        messageId: ''
      });
      expect(
        sqsClientStub.sendMessage.calledOnceWithExactly(eventsQueueUrl, {
          source: sourceApp,
          ...auditEvent,
          datetime: mockDate.toISOString()
        })
      ).toBeTruthy();
    });

    test('should throw error if sqs client returns error', async () => {
      expect.assertions(2);
      const error = new Error('invalid token');
      sqsClientStub.sendMessage.rejects(error);

      try {
        await service.createEvent(auditEvent);
      } catch (err) {
        expect(err).toEqual(error);
      }

      expect(
        sqsClientStub.sendMessage.calledOnceWithExactly(eventsQueueUrl, {
          source: sourceApp,
          ...auditEvent,
          datetime: mockDate.toISOString()
        })
      ).toBeTruthy();
    });
  });
});
