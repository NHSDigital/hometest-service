export interface INhsLoginConfig {
  clientId: string;
  expiresIn: number;
  redirectUri: string;
  baseUri: string;
  privateKey: string;
  /** Override for the JWKS endpoint. When set, used instead of `${baseUri}/.well-known/jwks.json`.
   * Useful when the lambda is in a VPC and needs to reach WireMock via internal service discovery
   * rather than going out through the public ALB/WAF. */
  jwksUri?: string;
}
