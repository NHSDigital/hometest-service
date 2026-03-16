export interface IAuthConfig {
  keyId: string | undefined;
  sessionMaxDurationMinutes: number;
  accessTokenExpiryDurationMinutes: number;
  refreshTokenExpiryDurationMinutes: number;
  privateKeys: Record<string, string>;
  publicKeys: Record<string, string>;
}
