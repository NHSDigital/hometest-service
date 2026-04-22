import jwt, { type SignOptions } from "jsonwebtoken";

import {
  type ISessionAccessTokenPayload,
  type ISessionRefreshTokenPayload,
} from "../models/auth/session-token-payload";
import { cleanupKey } from "./auth-utils";

export interface ISessionTokenServiceConfig {
  privateKey: string;
  accessTokenExpiryDurationMinutes: number;
  refreshTokenExpiryDurationMinutes: number;
}

export interface ISessionTokenService {
  signAccessToken: (payload: ISessionAccessTokenPayload) => string;
  signRefreshToken: (payload: ISessionRefreshTokenPayload) => string;
}

export class SessionTokenService implements ISessionTokenService {
  private readonly config: ISessionTokenServiceConfig;

  constructor(config: ISessionTokenServiceConfig) {
    if (!config.privateKey) {
      throw new Error("SessionTokenService requires a non-empty private key");
    }
    if (
      !Number.isFinite(config.accessTokenExpiryDurationMinutes) ||
      !Number.isInteger(config.accessTokenExpiryDurationMinutes) ||
      config.accessTokenExpiryDurationMinutes <= 0
    ) {
      throw new Error(
        "SessionTokenService requires accessTokenExpiryDurationMinutes to be a finite positive integer",
      );
    }
    if (
      !Number.isFinite(config.refreshTokenExpiryDurationMinutes) ||
      !Number.isInteger(config.refreshTokenExpiryDurationMinutes) ||
      config.refreshTokenExpiryDurationMinutes <= 0
    ) {
      throw new Error(
        "SessionTokenService requires refreshTokenExpiryDurationMinutes to be a finite positive integer",
      );
    }
    this.config = config;
  }

  public signAccessToken(payload: ISessionAccessTokenPayload): string {
    return this.signToken(payload, this.config.accessTokenExpiryDurationMinutes);
  }

  public signRefreshToken(payload: ISessionRefreshTokenPayload): string {
    return this.signToken(payload, this.config.refreshTokenExpiryDurationMinutes);
  }

  private signToken(
    payload: ISessionAccessTokenPayload | ISessionRefreshTokenPayload,
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
