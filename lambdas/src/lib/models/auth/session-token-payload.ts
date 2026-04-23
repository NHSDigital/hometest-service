export interface IAccessTokenPayload {
  sessionId: string;
  sessionCreatedAt: string;
}

export interface IRefreshTokenPayload {
  refreshTokenId: string;
}
