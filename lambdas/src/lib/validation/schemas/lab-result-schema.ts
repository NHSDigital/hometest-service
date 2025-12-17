import { type JSONSchemaType } from 'ajv';
import { BiomarkerCode } from '@dnhc-health-checks/shared';
import {
  type ILabResultDataRequestModel,
  type ILabResultRequestModel
} from '../../models/lab-results/lab-result-request-model';

const resultDataSchema: JSONSchemaType<ILabResultDataRequestModel> = {
  type: 'object',
  properties: {
    biomarkerCode: {
      type: 'string',
      enum: Object.values(BiomarkerCode)
    },
    value: { type: 'number', nullable: true },
    units: { type: 'string' },
    successful: { type: 'boolean', default: true },
    failureReasonCode: { type: 'string', nullable: true },
    failureReasonDescription: { type: 'string', nullable: true }
  },
  required: ['biomarkerCode'],
  additionalProperties: false,
  allOf: [
    {
      if: {
        properties: { successful: { const: true } }
      },
      then: {
        required: ['value', 'units'],
        properties: {
          value: { type: 'number', nullable: false },
          failureReasonCode: { type: 'null' },
          failureReasonDescription: { type: 'null' }
        }
      },
      else: {
        required: ['failureReasonCode', 'failureReasonDescription'],
        properties: {
          value: {
            type: 'null'
          }
        }
      }
    }
  ]
};

export const labResultSchema: JSONSchemaType<ILabResultRequestModel> = {
  type: 'object',
  properties: {
    orderId: { type: 'string' },
    orderExternalReference: { type: 'string' },
    pendingReorder: { type: 'boolean', default: false },
    resultData: {
      type: 'array',
      items: resultDataSchema,
      minItems: 1
    },
    resultDate: { type: 'string' }
  },
  required: ['orderId', 'orderExternalReference', 'resultData', 'resultDate'],
  additionalProperties: false
};
