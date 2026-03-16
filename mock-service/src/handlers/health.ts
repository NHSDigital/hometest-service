import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { jsonResponse } from "../utils/response";

export const handleHealth = async (
  _event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  return jsonResponse(200, {
    status: "ok",
    service: "mock-service",
    timestamp: new Date().toISOString(),
  });
};
