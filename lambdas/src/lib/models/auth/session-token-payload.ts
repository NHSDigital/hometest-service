export interface ISessionAccessTokenPayload {
  sessionId: string;
  sessionCreatedAt: string;
}

export interface ISessionRefreshTokenPayload {
  refreshTokenId: string;
}
