export interface IAuthConfig {
  sessionMaxDurationMinutes: number;
  accessTokenExpiryDurationMinutes: number;
  refreshTokenExpiryDurationMinutes: number;
  privateKeys: Record<string, string>;
  publicKeys: Record<string, string>;
  keyId: string;
}
