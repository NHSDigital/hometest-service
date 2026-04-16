export interface PostcodeLookupEnvVariables {
  postcodeLookupCredentialsSecretName: string;
  postcodeLookupBaseUrl: string;
  postcodeLookupTimeoutMs: number;
  postcodeLookupMaxRetries: number;
  postcodeLookupRetryDelayMs: number;
  postcodeLookupRetryBackoffFactor: number;
  useStubClient: boolean;
}
