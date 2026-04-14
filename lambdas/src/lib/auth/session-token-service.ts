import jwt, { type SignOptions } from "jsonwebtoken";

import {
  type IAccessTokenPayload,
  type IRefreshTokenPayload,
} from "../models/auth/session-token-payload";
import { cleanupKey } from "./auth-utils";

export interface ISessionTokenServiceConfig {
  privateKey: string;
  accessTokenExpiryDurationMinutes: number;
  refreshTokenExpiryDurationMinutes: number;
}

export interface ISessionTokenService {
  signAccessToken: (payload: IAccessTokenPayload) => string;
  signRefreshToken: (payload: IRefreshTokenPayload) => string;
}

export class SessionTokenService implements ISessionTokenService {
  private readonly config: ISessionTokenServiceConfig;

  constructor(config: ISessionTokenServiceConfig) {
    if (!config.privateKey) {
      throw new Error("SessionTokenService requires a non-empty private key");
    }
    this.config = config;
  }

  public signAccessToken(payload: IAccessTokenPayload): string {
    return this.signToken(payload, this.config.accessTokenExpiryDurationMinutes);
  }

  public signRefreshToken(payload: IRefreshTokenPayload): string {
    return this.signToken(payload, this.config.refreshTokenExpiryDurationMinutes);
  }

  private signToken(
    payload: IAccessTokenPayload | IRefreshTokenPayload,
    expiryDurationMinutes: number,
  ): string {
    // No kid header is set here. The header: { alg, kid } pattern from AuthTokenService
    // is omitted intentionally — add it when multi-key rotation support is required.
    const options: SignOptions = {
      expiresIn: `${expiryDurationMinutes}m`,
      algorithm: "RS512",
    };

    const privateKey = cleanupKey(this.config.privateKey) ?? this.config.privateKey;

    return jwt.sign(payload, privateKey, options);
  }
}
