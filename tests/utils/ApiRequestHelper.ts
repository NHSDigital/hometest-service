export interface ApiHeaders {
  [key: string]: string;
  "Content-Type": string;
  "X-Correlation-ID": string;
}

export function createHeaders(contentType: string, correlationId: string): ApiHeaders {
  return {
    "Content-Type": contentType,
    "X-Correlation-ID": correlationId,
  };
}

export const headersOrder: ApiHeaders = createHeaders(
  "application/json",
  "123e4567-e89b-42d3-a456-426614174000",
);

export const headersTestResults = (correlationId: string): ApiHeaders => ({
  "Content-Type": "application/fhir+json",
  "X-Correlation-ID": correlationId,
});
