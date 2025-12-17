import { type AuditEventType } from '@dnhc-health-checks/shared';

export interface IAuditEvent {
  id: string;
  healthCheckId?: string;
  hcDataModelVersion?: string;
  nhsNumber: string;
  odsCode: string;
  source?: string;
  nhcVersion: string;
  eventType: AuditEventType;
  details?: Record<string, boolean | number | string | string[] | null>;
  patientId?: string;
  datetime?: string;
}
