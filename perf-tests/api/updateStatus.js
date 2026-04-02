import http from "k6/http";

import { ORDER_STATUS_URL } from "../configuration/endpoints.js";

export function postOrderStatusUpdate(payload, headers) {
  return http.request("POST", ORDER_STATUS_URL, payload, { headers });
}
