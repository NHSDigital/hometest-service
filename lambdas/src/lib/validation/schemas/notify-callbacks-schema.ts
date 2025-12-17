import { type JSONSchemaType } from 'ajv';
import {
  type IChannel,
  type IMessageAttributes,
  type IMessageData,
  type INotifyCallbacksRequestModel,
  type IRoutingPlan
} from '../../models/notify-callbacks/notify-callbacks-request-model';

const channelSchema: JSONSchemaType<IChannel> = {
  type: 'object',
  properties: {
    type: { type: 'string' },
    channelStatus: { type: 'string' }
  },
  required: ['type', 'channelStatus']
};

const routingPlanSchema: JSONSchemaType<IRoutingPlan> = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    version: { type: 'string' },
    createdDate: { type: 'string' }
  },
  required: []
};

const messageAttributesSchema: JSONSchemaType<IMessageAttributes> = {
  type: 'object',
  properties: {
    messageId: { type: 'string' },
    messageReference: { type: 'string' },
    messageStatus: { type: 'string' },
    messageStatusDescription: { type: 'string' },
    channels: {
      type: 'array',
      items: channelSchema,
      minItems: 1
    },
    timestamp: { type: 'string' },
    routingPlan: routingPlanSchema
  },
  required: [
    'messageId',
    'messageReference',
    'messageStatus',
    'messageStatusDescription',
    'channels'
  ]
};

const messageDataSchema: JSONSchemaType<IMessageData> = {
  type: 'object',
  properties: {
    type: { type: 'string' },
    attributes: messageAttributesSchema,
    links: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: []
    },
    meta: {
      type: 'object',
      properties: {
        idempotencyKey: { type: 'string' }
      },
      required: []
    }
  },
  required: ['type', 'attributes']
};

export const notifyCallbacksSchema: JSONSchemaType<INotifyCallbacksRequestModel> =
  {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: messageDataSchema,
        minItems: 1
      }
    },
    required: ['data']
  };
