import { type INhsUserInfoResponseModel } from "../nhs-login/nhs-login-user-info-response-model";

export interface ISession {
  sessionId: string;
  refreshTokenId: string;
  nhsAccessToken: string;
  userInfo: INhsUserInfoResponseModel;
  sessionCreatedAt: string;
  lastRefreshAt: string;
  maxExpiresAt: string;
}
