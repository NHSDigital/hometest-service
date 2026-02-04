import { FetchHttpClient } from "../lib/http/http-client";

export interface Environment {
  httpClient: FetchHttpClient;
}

export function init(): Environment {
  const httpClient = new FetchHttpClient();

  return {
    httpClient,
  };
}
