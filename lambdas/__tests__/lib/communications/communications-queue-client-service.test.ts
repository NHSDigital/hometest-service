import Sinon from 'ts-sinon';
import {
  CommunicationsQueueClientService,
  type ICommunication,
  messageTypeMap
} from '../../../src/lib/communications/communications-queue-client-service';
import { Commons } from '../../../src/lib/commons';
import { SQSClientService } from '../../../src/lib/aws/sqs-client';
import { NotificationTemplate } from '@dnhc-health-checks/shared';

describe('communications queue client service', () => {
  it.each([
    {
      template: 'ALL_RESULTS',
      notificationType: 'ResultsAll',
      auditEventType: 'PatientResultsAvailable'
    },
    {
      template: 'SOME_RESULTS',
      notificationType: 'ResultsNotAll',
      auditEventType: 'PatientResultsAvailable'
    },
    {
      template: 'NUDGE_INITIAL_AFTER_START',
      notificationType: 'NudgeInitialAfterStart',
      auditEventType: 'NudgeSentQuestionnaire'
    },
    {
      template: 'HEALTH_CHECK_AUTO_EXPIRED',
      notificationType: 'QuestionnaireExpiry',
      auditEventType: 'HealthCheckExpiredPatientNotification'
    }
  ])(
    'should map message types correctly',
    ({ template, notificationType, auditEventType }) => {
      expect(messageTypeMap[template].notificationType).toEqual(
        notificationType
      );
      expect(messageTypeMap[template].auditEventType).toEqual(auditEventType);
    }
  );

  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  const queueUrl: string = 'pdm-queue-url';

  let commons: Sinon.SinonStubbedInstance<Commons>;
  let sqsClient: Sinon.SinonStubbedInstance<SQSClientService>;

  let service: CommunicationsQueueClientService;

  beforeEach(() => {
    commons = sandbox.createStubInstance(Commons);
    sqsClient = sandbox.createStubInstance(SQSClientService);

    service = new CommunicationsQueueClientService(
      commons as unknown as Commons,
      queueUrl,
      sqsClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  const payload = {
    healthCheckId: 'hearty-health',
    patientId: 'patient-patient',
    nhsNumber: 'nhs-number',
    details: 'sensitive-info',
    correlationId: 'strong-negative-correlation',
    odsCode: 'some-code',
    notificationTemplate: 'ALL_RESULTS',
    additionalEventDetails: {
      prop: 'value'
    },
    templateDataFields: {
      field: 'fieldValue'
    }
  } as ICommunication;

  const sqsResponse = { messageId: '12345' };

  it('should send sqs message', async () => {
    sqsClient.sendMessage.resolves(sqsResponse);

    const response = await service.createCommunication(payload);

    sandbox.assert.calledOnceWithExactly(sqsClient.sendMessage, queueUrl, {
      healthCheckId: payload.healthCheckId,
      patientId: payload.patientId,
      nhsNumber: payload.nhsNumber,
      correlationId: payload.correlationId,
      odsCode: payload.odsCode,
      notificationTemplate: payload.notificationTemplate,
      additionalEventDetails: payload.additionalEventDetails,
      templateDataFields: payload.templateDataFields
    });

    expect(response).toEqual(sqsResponse);
  });

  it('should throw when sending sqs message failed', async () => {
    const payload: ICommunication = {
      healthCheckId: 'hearty-health',
      patientId: 'patient-patient',
      nhsNumber: 'nhs-number',
      correlationId: 'strong-negative-correlation',
      odsCode: 'some-code',
      notificationTemplate: NotificationTemplate.ALL_RESULTS
    };
    const error = new Error('unlucky');
    sqsClient.sendMessage.rejects(error);

    let err;
    try {
      await service.createCommunication(payload);
    } catch (error) {
      err = error;
    } finally {
      expect(err).toEqual(error);
    }

    sandbox.assert.calledOnceWithExactly(sqsClient.sendMessage, queueUrl, {
      healthCheckId: payload.healthCheckId,
      patientId: payload.patientId,
      nhsNumber: payload.nhsNumber,
      correlationId: payload.correlationId,
      odsCode: payload.odsCode,
      notificationTemplate: payload.notificationTemplate
    });
  });
});
