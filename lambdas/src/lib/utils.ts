import { APIGatewayProxyEvent } from "aws-lambda/trigger/api-gateway-proxy";

export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    str,
  );
}

export const getCorrelationIdFromEventHeaders = (event: APIGatewayProxyEvent): string => {
  return (
    event.headers["X-Correlation-ID"] ||
    event.headers["x-correlation-id"] ||
    crypto.randomUUID()
  );
};
