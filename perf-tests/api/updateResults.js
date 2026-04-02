import http from "k6/http";

import { RESULT_URL } from "../configuration/endpoints.js";

export function postResult(payload, headers) {
  return http.request("POST", RESULT_URL, payload, { headers });
}
