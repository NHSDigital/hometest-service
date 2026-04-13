export interface PostcodeLookupClientConfig {
  credentials: {
    apiKey: string;
  };
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  retryBackoffFactor: number;
}
