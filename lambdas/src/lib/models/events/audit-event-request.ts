export interface IAuditEventRequest {
  healthCheckId?: string;
  hcDataModelVersion?: string;
  eventType: string;
  details?: Record<string, boolean | number | string | null>;
}
