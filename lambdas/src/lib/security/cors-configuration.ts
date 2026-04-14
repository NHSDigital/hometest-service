import { type Options } from "@middy/http-cors";

import { retrieveMandatoryEnvVariable } from "../utils/utils";

export const defaultCorsOptions: Options = {
  credentials: true,
  headers: "Content-Type, Authorization, X-Correlation-ID",
  origin: retrieveMandatoryEnvVariable("ALLOW_ORIGIN"),
};
