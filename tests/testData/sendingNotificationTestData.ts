import { NotificationTemplate } from '@dnhc-health-checks/shared';
import type { ICommunication } from '../lib/aws/sqs/communicationsQueueClientServce';
import { v4 as uuidv4 } from 'uuid';

interface ISendNotificationPayload {
  notificationMessageTemplate: NotificationTemplate;
  expectedAuditEventMessageType: string;
}

export function getTestNotifyMessage(
  template: NotificationTemplate,
  nhsNumber: string,
  healthCheckId: string = uuidv4()
): ICommunication {
  return {
    healthCheckId: healthCheckId,
    nhsNumber: nhsNumber,
    patientId: uuidv4(),
    details: 'Health check finished',
    correlationId: uuidv4(),
    notificationTemplate: template
  };
}

export const sendNotificationTestData: ISendNotificationPayload[] = [
  {
    notificationMessageTemplate: NotificationTemplate.ALL_RESULTS,
    expectedAuditEventMessageType: 'ResultsAll'
  },
  {
    notificationMessageTemplate: NotificationTemplate.SOME_RESULTS,
    expectedAuditEventMessageType: 'ResultsNotAll'
  }
];
