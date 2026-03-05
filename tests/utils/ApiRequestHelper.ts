import { OrderStatusTaskPayload } from "../test-data/OrderStatusTypes";

export interface ApiHeaders {
  [key: string]: string;
  "Content-Type": string;
  "X-Correlation-ID": string;
}

export const orderStatusPayload = (
  orderUid: string,
  patientUid: string,
  defaultStatus: string,
  defaultIntent: string,
  overrides: Partial<OrderStatusTaskPayload> = {},
): OrderStatusTaskPayload => ({
  resourceType: "Task",
  status: defaultStatus,
  intent: defaultIntent,
  basedOn: [{ reference: `Order/${orderUid}` }],
  for: { reference: `Patient/${patientUid}` },
  businessStatus: { text: "dispatched" },
  lastModified: new Date().toISOString(),
  ...overrides,
});

export function createHeaders(contentType: string, correlationId: string): ApiHeaders {
  return {
    "Content-Type": contentType,
    "X-Correlation-ID": correlationId,
  };
}

export const buildHeaders = (correlationId: string): Record<string, string> => ({
  "Content-Type": "application/json",
  "X-Correlation-ID": correlationId,
});

export const headersOrder: ApiHeaders = createHeaders(
  "application/json",
  "123e4567-e89b-42d3-a456-426614174000",
);

export const headersTestResults = (correlationId: string): ApiHeaders => ({
  "Content-Type": "application/fhir+json",
  "X-Correlation-ID": correlationId,
});
