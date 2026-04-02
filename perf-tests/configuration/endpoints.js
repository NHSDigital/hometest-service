const API_GATEWAY_BASE_URL =
  __ENV.API_GATEWAY_BASE_URL || "http://127.0.0.1:4566/_aws/execute-api/lwedds9nct/local";

export const ORDER_URL = `${API_GATEWAY_BASE_URL}/order`;
export const ORDER_STATUS_URL = `${API_GATEWAY_BASE_URL}/test-order/status`;
export const RESULT_URL = `${API_GATEWAY_BASE_URL}/result`;
