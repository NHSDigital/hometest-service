import { type Options } from "@middy/http-cors";
import { defaultCorsOptions as sharedDefaultCorsOptions } from "../lib/security/cors-configuration";

const customCorsOptions: Options = {
  methods: "POST, OPTIONS",
};

export const corsOptions: Options = {
  ...sharedDefaultCorsOptions,
  ...customCorsOptions,
};
