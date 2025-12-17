import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import { SQSClientService } from '../../../src/lib/aws/sqs-client';
import { PdmQueueClientService } from '../../../src/lib/pdm/pdm-queue-client-service';
import { GpUpdateReason } from '../../../src/lib/models/gp-update/gp-update-scheduler';
import { Operation } from '../../../src/lib/models/pdm/resource';
import { GlobalConfigurationService } from '../../../src/lib/global-configuration-service';

describe('PdmQueueClientService', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  const queueUrl: string = 'pdm-queue-url';
  const healthCheckId: string = 'health-check-id';
  const patientId: string = 'patient-patient-id';
  const sqsResponse = { messageId: '12345' };

  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let sqsClient: Sinon.SinonStubbedInstance<SQSClientService>;
  let globalConfigurationService: Sinon.SinonStubbedInstance<GlobalConfigurationService>;

  let service: PdmQueueClientService;

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    sqsClient = sandbox.createStubInstance(SQSClientService);
    globalConfigurationService = sandbox.createStubInstance(
      GlobalConfigurationService
    );

    service = new PdmQueueClientService(
      commonsStub as unknown as Commons,
      queueUrl,
      sqsClient,
      globalConfigurationService as unknown as GlobalConfigurationService
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('processCompleteRecord', () => {
    test('should send message to queue when enabled', async () => {
      sqsClient.sendMessage.resolves(sqsResponse);
      globalConfigurationService.isPdmEnabled.resolves(true);

      await service.processCompleteRecord(healthCheckId, patientId);

      sandbox.assert.calledOnceWithExactly(sqsClient.sendMessage, queueUrl, {
        healthCheckId,
        patientId,
        operation: Operation.Complete
      });
    });

    test('shouldnt send message to queue when disabled', async () => {
      sqsClient.sendMessage.resolves(sqsResponse);
      globalConfigurationService.isPdmEnabled.resolves(false);

      await service.processCompleteRecord(healthCheckId, patientId);

      sandbox.assert.notCalled(sqsClient.sendMessage);
    });

    test('should throw error if sqs client returns error', async () => {
      globalConfigurationService.isPdmEnabled.resolves(true);

      const error = new Error('some error sending message');
      sqsClient.sendMessage.rejects(error);

      let errorMsg;
      try {
        await service.processCompleteRecord(healthCheckId, patientId);
      } catch (err) {
        errorMsg = err;
      } finally {
        expect(errorMsg).toEqual(error);
      }

      sandbox.assert.calledOnceWithExactly(sqsClient.sendMessage, queueUrl, {
        healthCheckId,
        patientId,
        operation: Operation.Complete
      });
    });
  });

  describe('processPartialRecord', () => {
    test('should send message when reasons match valid scenarios', async () => {
      sqsClient.sendMessage.resolves(sqsResponse);
      globalConfigurationService.isPdmEnabled.resolves(true);

      await service.processPartialRecord(healthCheckId, [
        GpUpdateReason.urgentHighBP
      ]);

      sandbox.assert.calledOnceWithExactly(sqsClient.sendMessage, queueUrl, {
        healthCheckId,
        operation: Operation.Partial
      });
    });

    test('shouldnt send message when reasons match valid scenarios if disabled', async () => {
      sqsClient.sendMessage.resolves(sqsResponse);
      globalConfigurationService.isPdmEnabled.resolves(false);

      await service.processPartialRecord(healthCheckId, [
        GpUpdateReason.urgentHighBP
      ]);

      sandbox.assert.notCalled(sqsClient.sendMessage);
    });

    test('shouldnt send message when no reasons match valid scenarios', async () => {
      sqsClient.sendMessage.resolves(sqsResponse);
      globalConfigurationService.isPdmEnabled.resolves(true);

      await service.processPartialRecord(healthCheckId, [
        GpUpdateReason.bloodResultOutstanding
      ]);

      sandbox.assert.notCalled(sqsClient.sendMessage);
    });

    test('should throw error if sqs client returns error', async () => {
      globalConfigurationService.isPdmEnabled.resolves(true);

      const error = new Error('some error sending message');
      sqsClient.sendMessage.rejects(error);

      let errorMsg;
      try {
        await service.processPartialRecord(healthCheckId, [
          GpUpdateReason.urgentHighBP
        ]);
      } catch (err) {
        errorMsg = err;
      } finally {
        expect(errorMsg).toEqual(error);
      }

      sandbox.assert.calledOnceWithExactly(sqsClient.sendMessage, queueUrl, {
        healthCheckId,
        operation: Operation.Partial
      });
    });
  });
});
