import http from "k6/http";

import { ORDER_URL } from "../configuration/endpoints.js";

export function postCreateOrder(payload, headers) {
  return http.request("POST", ORDER_URL, payload, { headers });
}
