export interface GetResultParams extends Record<string, string | number | boolean> {
  nhs_number: string;
  date_of_birth: string;
  order_id: string;
}

export interface GetResultHeaders extends Record<string, string> {
  "X-Correlation-ID": string;
}

export const createGetResultParams = (
  nhsNumber: string,
  dateOfBirth: string,
  orderId: string,
): GetResultParams => ({
  nhs_number: nhsNumber,
  date_of_birth: dateOfBirth,
  order_id: orderId,
});

export const createGetResultHeaders = (correlationId: string): GetResultHeaders => ({
  "X-Correlation-ID": correlationId,
});
