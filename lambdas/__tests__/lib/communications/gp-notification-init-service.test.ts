import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import { SQSClientService } from '../../../src/lib/aws/sqs-client';
import { GpNotificationInitService } from '../../../src/lib/communications/gp-notification-init-service';
import { Operation } from '../../../src/lib/models/pdm/resource';
import { FollowUpConsultationRequired } from '../../../src/lib/emis/consultation-generation/emis-consultations-generation-service';
import { FollowUpType } from '../../../src/lib/follow-ups/health-check-follow-up-service';

describe('GpNotificationInitService', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();

  const queueUrl: string = 'gp-notify-queue-url';

  const sqsResponse = { messageId: '12345' };

  const details = {
    healthCheckId: 'health-check-id',
    patientGpOdsCode: 'oh-dee-es',
    patientNhsNumber: '090909090909',
    followUp: FollowUpConsultationRequired.Yes,
    followUpReasons: [
      { reason: 'Follow up reason', type: FollowUpType.Routine }
    ],
    correlationId: 'cor-rel-lation-111',
    writeBackDate: '20.04.2024'
  };

  let commons: Sinon.SinonStubbedInstance<Commons>;
  let sqsClient: Sinon.SinonStubbedInstance<SQSClientService>;

  let service: GpNotificationInitService;

  beforeEach(() => {
    commons = sandbox.createStubInstance(Commons);
    sqsClient = sandbox.createStubInstance(SQSClientService);

    service = new GpNotificationInitService(
      commons as unknown as Commons,
      queueUrl,
      sqsClient
    );
  });

  afterEach(() => {
    sandbox.reset();
    sandbox.resetHistory();
  });

  describe('notifyCompleteHealthCheck', () => {
    const detailsMessage = {
      ...details,
      healthCheckStatus: Operation.Complete
    };

    test('should send message to queue with correct status', async () => {
      sqsClient.sendMessage.resolves(sqsResponse);

      await service.notifyCompleteHealthCheck(detailsMessage);

      sandbox.assert.calledOnceWithExactly(
        sqsClient.sendMessage,
        queueUrl,
        detailsMessage
      );
    });

    test('should throw error if sqs client returns error', async () => {
      const error = new Error('some error sending message');
      sqsClient.sendMessage.rejects(error);

      let errorMsg;
      try {
        await service.notifyCompleteHealthCheck(detailsMessage);
      } catch (err) {
        errorMsg = err;
      } finally {
        expect(errorMsg).toEqual(error);
      }

      sandbox.assert.calledOnceWithExactly(
        sqsClient.sendMessage,
        queueUrl,
        detailsMessage
      );
    });
  });

  describe('notifyIncompleteHealthCheck', () => {
    const detailsMessage = {
      ...details,
      healthCheckStatus: Operation.Partial
    };

    test('should send message to queue with correct status', async () => {
      sqsClient.sendMessage.resolves(sqsResponse);

      await service.notifyIncompleteHealthCheck(detailsMessage);

      sandbox.assert.calledOnceWithExactly(
        sqsClient.sendMessage,
        queueUrl,
        detailsMessage
      );
    });

    test('should throw error if sqs client returns error', async () => {
      const error = new Error('some error sending message');
      sqsClient.sendMessage.rejects(error);

      let errorMsg;
      try {
        await service.notifyIncompleteHealthCheck(detailsMessage);
      } catch (err) {
        errorMsg = err;
      } finally {
        expect(errorMsg).toEqual(error);
      }

      sandbox.assert.calledOnceWithExactly(
        sqsClient.sendMessage,
        queueUrl,
        detailsMessage
      );
    });
  });
});
