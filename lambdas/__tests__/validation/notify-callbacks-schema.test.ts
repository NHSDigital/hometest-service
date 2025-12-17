import {
  SchemaValidationService,
  ValidatorType
} from '../../src/lib/validation/schema-validator';
import { Commons } from '../../src/lib/commons';

describe('notifyCallbacksSchema', () => {
  const commons = new Commons('test', 'test');
  const schemaValidationService = new SchemaValidationService(commons);

  const validate = (input: any): boolean => {
    const result = schemaValidationService.validateObject(
      input,
      ValidatorType.NotifyCallbacks
    );
    if (!result.isValid) {
      console.log(result.errorDetails);
    }
    return result.isValid;
  };

  const baseMessage = {
    data: [
      {
        type: 'MessageStatus',
        attributes: {
          messageId: '2WL3qFTEFM0qMY8xjRbt1LIKCzM',
          messageReference: '1642109b-69eb-447f-8f97-ab70a74f5db4',
          messageStatus: 'sending',
          messageStatusDescription: ' ',
          channels: [{ type: 'email', channelStatus: 'delivered' }],
          timestamp: '2023-11-17T14:27:51.413Z',
          routingPlan: {
            id: 'abc',
            name: 'Plan',
            version: '1',
            createdDate: '2023-11-17T14:27:51.413Z'
          }
        },
        links: {
          message: 'http://localhost/message'
        },
        meta: {
          idempotencyKey: 'some-key'
        }
      }
    ]
  };

  it('validates correct payload', () => {
    expect(validate(baseMessage)).toBe(true);
  });

  it('fails if data is missing', () => {
    expect(validate({})).toBe(false);
  });

  it('fails if data is an empty array', () => {
    expect(validate({ data: [] })).toBe(false);
  });

  it('fails if required attributes fields are missing', () => {
    const message = {
      ...baseMessage.data[0],
      attributes: {}
    };
    expect(validate({ data: [message] })).toBe(false);
  });

  it('fails if channels is missing', () => {
    const message = {
      ...baseMessage.data[0],
      attributes: {
        ...baseMessage.data[0].attributes,
        channels: undefined
      }
    };
    delete message.attributes.channels;
    expect(validate({ data: [message] })).toBe(false);
  });

  it('passes if routingPlan is missing', () => {
    const message = {
      ...baseMessage.data[0],
      attributes: {
        ...baseMessage.data[0].attributes,
        routingPlan: undefined
      }
    };
    delete message.attributes.routingPlan;
    expect(validate({ data: [message] })).toBe(true);
  });

  it('fails if messageId is not a string', () => {
    const message = {
      ...baseMessage.data[0],
      attributes: {
        ...baseMessage.data[0].attributes,
        messageId: 12345
      }
    };
    expect(validate({ data: [message] })).toBe(false);
  });

  it('fails if channels is empty array', () => {
    const message = {
      ...baseMessage.data[0],
      attributes: {
        ...baseMessage.data[0].attributes,
        channels: []
      }
    };
    expect(validate({ data: [message] })).toBe(false);
  });

  it('fails if a channel is missing channelStatus', () => {
    const message = {
      ...baseMessage.data[0],
      attributes: {
        ...baseMessage.data[0].attributes,
        channels: [{ type: 'sms' }]
      }
    };
    expect(validate({ data: [message] })).toBe(false);
  });

  it('passes if links or meta are missing', () => {
    const message = {
      ...baseMessage.data[0],
      links: undefined,
      meta: undefined
    };
    delete message.links;
    delete message.meta;
    expect(validate({ data: [message] })).toBe(true);
  });

  it('fails if messageStatus is missing', () => {
    const message = structuredClone(baseMessage.data[0]);
    const invalidAttributes = { ...message.attributes } as any;
    delete invalidAttributes.messageStatus;

    message.attributes = invalidAttributes;

    expect(validate({ data: [message] })).toBe(false);
  });

  it('allows extra unknown field at root', () => {
    const input = {
      ...baseMessage,
      unexpected: 'field'
    };
    expect(validate(input)).toBe(true);
  });
});
