import { Service } from '../service';
import {
  type ISQSClientResponse,
  type SQSClientService
} from '../aws/sqs-client';
import { type Commons } from '../commons';
import { type IAuditEvent } from '../models/events/audit-event';
import { type UserSource } from '../models/session/session';

export class EventsQueueClientService extends Service {
  readonly eventsQueueUrl: string;
  readonly sqsClient: SQSClientService;
  source: UserSource;

  constructor(
    commons: Commons,
    eventsQueueUrl: string,
    sqsClient: SQSClientService
  ) {
    super(commons, 'EventsQueueClientService');
    this.eventsQueueUrl = eventsQueueUrl;
    this.sqsClient = sqsClient;
  }

  async createEvent(auditEvent: IAuditEvent): Promise<ISQSClientResponse> {
    try {
      const result = await this.sqsClient.sendMessage(this.eventsQueueUrl, {
        source: this.source,
        ...auditEvent,
        datetime: new Date().toISOString()
      });
      this.logger.info('Audit event created', {
        result,
        auditEventId: auditEvent.id,
        healthCheckId: auditEvent.healthCheckId,
        eventType: auditEvent.eventType
      });
      return { messageId: result.messageId ?? '' };
    } catch (error) {
      this.logger.error('Could not create audit event', {
        error,
        auditEventId: auditEvent.id
      });
      throw error;
    }
  }
}
