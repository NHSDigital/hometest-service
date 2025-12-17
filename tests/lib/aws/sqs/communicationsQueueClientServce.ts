import { type NotificationTemplate } from '@dnhc-health-checks/shared';
import { SqsClientService } from './sqsClient';
export interface ICommunication {
  healthCheckId: string;
  nhsNumber: string;
  details: string;
  correlationId: string;
  patientId: string;
  notificationTemplate: NotificationTemplate;
}
export class CommunicationsQueueClientService extends SqsClientService<ICommunication> {
  constructor(envName: string) {
    super(envName, 'NhcCommunications');
  }
}
