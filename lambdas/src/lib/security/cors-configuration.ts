import { type Options } from "@middy/http-cors";

const allowOrigin = process.env.ALLOW_ORIGIN;

export const defaultCorsOptions: Options = {
  credentials: true,
  headers: "Content-Type, Authorization, X-Correlation-ID",
  origin: allowOrigin,
};
