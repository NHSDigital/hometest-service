import { type JSONSchemaType } from 'ajv';
import { type IHealthCheckBloodTestOrder } from '@dnhc-health-checks/shared';

export const bloodTestOrderSchema: JSONSchemaType<IHealthCheckBloodTestOrder> =
  {
    type: 'object',
    properties: {
      address: {
        type: 'object',
        properties: {
          addressLine1: {
            type: 'string',
            minLength: 1,
            format: 'freeTextInput'
          },
          addressLine2: { type: 'string', format: 'freeTextInput' },
          addressLine3: { type: 'string', format: 'freeTextInput' },
          townCity: { type: 'string', minLength: 1, format: 'freeTextInput' },
          postcode: { type: 'string', minLength: 1, format: 'postcode' }
        },
        required: ['addressLine1', 'townCity', 'postcode'],
        nullable: true,
        additionalProperties: false
      },
      phoneNumber: {
        type: 'string',
        nullable: true,
        minLength: 0,
        maxLength: 15,
        pattern: '^$|^[0-9]+$'
      },
      searchParams: {
        type: 'object',
        properties: {
          postcode: { type: 'string', minLength: 1, format: 'postcode' },
          buildingNumber: {
            type: 'string',
            format: 'freeTextInput',
            nullable: true
          }
        },
        required: ['postcode'],
        nullable: true,
        additionalProperties: false
      },
      isBloodTestSectionSubmitted: { type: 'boolean', nullable: true }
    },
    additionalProperties: false
  };
