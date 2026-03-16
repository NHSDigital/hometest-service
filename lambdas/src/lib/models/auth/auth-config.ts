export interface IAuthConfig {
  keyId?: string;
  sessionMaxDurationMinutes: number;
  accessTokenExpiryDurationMinutes: number;
  refreshTokenExpiryDurationMinutes: number;
  privateKeys: Record<string, string>;
  publicKeys: Record<string, string>;
}
