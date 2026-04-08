import { type INhsUserInfoResponseModel } from "../nhs-login/nhs-login-user-info-response-model";

export type SessionMetadataValue = string | number | boolean | null;

export type SessionMetadata = Record<string, SessionMetadataValue>;

export interface ISession {
  sessionId: string;
  refreshTokenId: string;
  nhsAccessToken: string;
  userInfo: INhsUserInfoResponseModel;
  sessionStartAt: string;
  lastRefreshAt: string;
  maxExpiresAt: string;
  createdAt: string;
  updatedAt: string;
  metadata: SessionMetadata;
}
