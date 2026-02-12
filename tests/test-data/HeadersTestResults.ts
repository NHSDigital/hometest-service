export const headersTestResults = {
  "Content-Type": "application/fhir+json",
  "X-Correlation-ID": "123e4567-e89b-12d3-a456-426614174999"
} as const;

export type HeadersTestResults = typeof headersTestResults;
