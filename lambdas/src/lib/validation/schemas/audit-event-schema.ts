import { type JSONSchemaType } from 'ajv';
import { type IAuditEventRequest } from '../../models/events/audit-event-request';
import { AuditEventType } from '@dnhc-health-checks/shared';

export const auditEventSchema: JSONSchemaType<IAuditEventRequest> = {
  type: 'object',
  properties: {
    healthCheckId: { type: 'string', nullable: true },
    eventType: {
      type: 'string',
      enum: Object.values(AuditEventType)
    },
    hcDataModelVersion: { type: 'string', nullable: true },
    details: {
      type: 'object',
      additionalProperties: {
        type: ['string', 'number', 'boolean'],
        nullable: true
      },
      required: [],
      nullable: true
    }
  },
  required: ['eventType'],
  additionalProperties: false
};
