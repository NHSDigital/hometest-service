export const headersOrder = {
  'Content-Type': 'application/json',
  'X-Correlation-ID': '123e4567-e89b-42d3-a456-426614174000',
} as const;

export type HeadersOrder = typeof headersOrder;
