export type headersTestResults = {
  "Content-Type": "application/fhir+json";
  "X-Correlation-ID": string;
};

export const createHeadersTestResults = (
  correlationId: string,
): headersTestResults => ({
  "Content-Type": "application/fhir+json",
  "X-Correlation-ID": correlationId,
});
