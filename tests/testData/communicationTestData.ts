import {
  CommunicationLogType,
  type ICommunicationLogItem
} from '../lib/aws/dynamoDB/DbCommunicationLogService';
import { v4 as uuidv4 } from 'uuid';
import {
  notifyValidPayload,
  notifyValidPayloadWithTwoMessages
} from './notifyPayloadTestData';
import type { NotifyCallbackPayloadSchema } from '../lib/apiClients/notifyCallbackResources/NotifyCallbackApiResources';

export function getCommunicationLogItem(
  override?: Partial<ICommunicationLogItem>
): ICommunicationLogItem {
  return {
    healthCheckId: uuidv4(),
    type: CommunicationLogType.ResultsAll,
    createdAt: new Date().toISOString(),
    messageId: uuidv4(),
    messageReference: messageReference,
    messageStatusDescription: 'default-test-status-description',
    ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90, // 90 days TTL,
    ...override
  };
}

interface ICommunicationTestData {
  communicationLogItems: ICommunicationLogItem[];
  notificationPayload: NotifyCallbackPayloadSchema;
  expectedUpdate: boolean;
  description: string;
}

const messageReference = uuidv4();
const messageReference2 = uuidv4();

export function communicationTestData(): ICommunicationTestData[] {
  return [
    {
      communicationLogItems: [
        getCommunicationLogItem({
          messageReference,
          messageStatus: 'test-status'
        })
      ],
      notificationPayload: notifyValidPayload(messageReference),
      expectedUpdate: false,
      description: 'No change expected in the communication log item'
    },
    {
      communicationLogItems: [
        getCommunicationLogItem({
          messageReference
        })
      ],
      notificationPayload: notifyValidPayload(messageReference, 'failed'),
      expectedUpdate: true,
      description: 'Expected changes in db item due to status failed'
    },
    {
      communicationLogItems: [
        getCommunicationLogItem({
          messageReference
        })
      ],
      notificationPayload: notifyValidPayload(messageReference, 'delivered'),
      expectedUpdate: true,
      description: 'Expected changes in db item due to status delivered'
    },
    {
      communicationLogItems: [
        getCommunicationLogItem({
          messageReference,
          messageStatus: 'test-status'
        }),
        getCommunicationLogItem({
          messageReference: messageReference2,
          messageStatus: 'test-status'
        })
      ],
      notificationPayload: notifyValidPayloadWithTwoMessages(
        messageReference,
        messageReference2
      ),
      expectedUpdate: false,
      description:
        'Multiple messages - No change expected in the communication log items'
    },
    {
      communicationLogItems: [
        getCommunicationLogItem({
          messageReference
        }),
        getCommunicationLogItem({
          messageReference: messageReference2
        })
      ],
      notificationPayload: notifyValidPayloadWithTwoMessages(
        messageReference,
        messageReference2,
        'delivered'
      ),
      expectedUpdate: true,
      description:
        'Multiple messages - expected changes in both db item due to status delivered'
    },
    {
      communicationLogItems: [
        getCommunicationLogItem({
          messageReference
        }),
        getCommunicationLogItem({
          messageReference: messageReference2
        })
      ],
      notificationPayload: notifyValidPayloadWithTwoMessages(
        messageReference,
        messageReference2,
        'failed'
      ),
      expectedUpdate: true,
      description:
        'Multiple messages - expected changes in both db item due to status failed'
    }
  ];
}
