import { v4 as uuidv4 } from 'uuid';
import type {
  NotifyCallbackPayloadSchema,
  NotifyPayloadSingleItem
} from '../lib/apiClients/notifyCallbackResources/NotifyCallbackApiResources';

export function notifyCallbackSingleValidPayload(
  messageReference: string = uuidv4(),
  messageStatus: string = 'sending'
): NotifyPayloadSingleItem {
  return {
    type: 'MessageStatus',
    attributes: {
      messageId: '2WL3qFTEFM0qMY8xjRbt1LIKCzM',
      messageReference: messageReference,
      messageStatus: messageStatus,
      messageStatusDescription: 'request description',
      channels: [
        {
          type: 'email',
          channelStatus: 'delivered'
        }
      ],
      timestamp: '2023-11-17T14:27:51.413Z',
      routingPlan: {
        id: 'b838b13c-f98c-4def-93f0-515d4e4f4ee1',
        name: 'Plan Abc',
        version: 'ztoe2qRAM8M8vS0bqajhyEBcvXacrGPp',
        createdDate: '2023-11-17T14:27:51.413Z'
      }
    },
    links: {
      message:
        'https://api.service.nhs.uk/comms/v1/messages/2WL3qFTEFM0qMY8xjRbt1LIKCzM'
    },
    meta: {
      idempotencyKey:
        '2515ae6b3a08339fba3534f3b17cd57cd573c57d25b25b9aae08e42dc9f0a445'
    }
  };
}

export function notifyValidPayload(
  messageReference: string = uuidv4(),
  messageStatus: string = 'sending'
): NotifyCallbackPayloadSchema {
  return {
    data: [notifyCallbackSingleValidPayload(messageReference, messageStatus)]
  };
}

export function notifyValidPayloadWithTwoMessages(
  messageReference: string = uuidv4(),
  messageReference2: string = uuidv4(),
  messageStatus: string = 'sending'
): NotifyCallbackPayloadSchema {
  return {
    data: [
      notifyCallbackSingleValidPayload(messageReference, messageStatus),
      notifyCallbackSingleValidPayload(messageReference2, messageStatus)
    ]
  };
}

export const notifyInvalidPayload = {
  data: [
    {
      type: 'MessageStatus',
      attributes: {
        messageId: '2WL3qFTEFM0qMY8xjRbt1LIKCzM',
        channels: [
          {
            type: 'email',
            channelStatus: 'delivered'
          }
        ],
        timestamp: '2023-11-17T14:27:51.413Z',
        routingPlan: {
          id: 'b838b13c-f98c-4def-93f0-515d4e4f4ee1',
          name: 'Plan Abc',
          version: 'ztoe2qRAM8M8vS0bqajhyEBcvXacrGPp',
          createdDate: '2023-11-17T14:27:51.413Z'
        }
      },
      links: {
        message:
          'https://api.service.nhs.uk/comms/v1/messages/2WL3qFTEFM0qMY8xjRbt1LIKCzM'
      },
      meta: {
        idempotencyKey:
          '2515ae6b3a08339fba3534f3b17cd57cd573c57d25b25b9aae08e42dc9f0a445'
      }
    }
  ]
};

export const notifyPayload500Error = {
  data: [
    {
      type: 'MessageStatus',
      attributes: {
        messageId: '',
        messageReference: '',
        messageStatus: 'sending',
        messageStatusDescription: 'request description',
        channels: [
          {
            type: 'email',
            channelStatus: 'delivered'
          }
        ],
        timestamp: '2023-11-17T14:27:51.413Z',
        routingPlan: {
          id: 'b838b13c-f98c-4def-93f0-515d4e4f4ee1',
          name: 'Plan Abc',
          version: 'ztoe2qRAM8M8vS0bqajhyEBcvXacrGPp',
          createdDate: '2023-11-17T14:27:51.413Z'
        }
      },
      links: {
        message:
          'https://api.service.nhs.uk/comms/v1/messages/2WL3qFTEFM0qMY8xjRbt1LIKCzM'
      },
      meta: {
        idempotencyKey:
          '2515ae6b3a08339fba3534f3b17cd57cd573c57d25b25b9aae08e42dc9f0a445'
      }
    }
  ]
};
