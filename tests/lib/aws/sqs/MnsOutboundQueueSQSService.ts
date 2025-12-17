import type { IMnsOutboundQueueMessage } from '@dnhc-health-checks/shared';
import { SqsClientService } from './sqsClient';

export class MnsOutboundQueueSQSService extends SqsClientService<IMnsOutboundQueueMessage> {
  constructor(envName: string) {
    super(envName, 'NhcMnsOutbound');
  }
}
