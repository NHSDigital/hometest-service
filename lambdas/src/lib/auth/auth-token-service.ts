import jwt, { type SignOptions } from "jsonwebtoken";
import { type IAuthConfig } from "../models/auth/auth-config";
import {
  type AuthAccessTokenConfig,
  type AuthRefreshTokenConfig,
} from "../models/auth/auth-token-config";
import { cleanupKey } from "./auth-utils";

// ALPHA: This file will need revisiting.
export interface IAuthTokenService {
  generateAuthAccessToken: (authAccessTokenConfig: AuthAccessTokenConfig) => string;
  generateAuthRefreshToken: (authRefreshTokenConfig: AuthRefreshTokenConfig) => string;
}

// ALPHA: Removed commons use. To be reintroduced for logging later.
export class AuthTokenService implements IAuthTokenService {
  private readonly authConfig: IAuthConfig;

  constructor(authConfig: IAuthConfig) {
    this.authConfig = authConfig;
  }

  public generateAuthAccessToken(authAccessTokenConfig: AuthAccessTokenConfig): string {
    const jwtBody = {
      ...authAccessTokenConfig,
    };

    const jwtOptions: SignOptions = {
      expiresIn: `${this.authConfig.accessTokenExpiryDurationMinutes}m`,
      algorithm: "RS512",
      header: {
        alg: "RS512",
        kid: this.authConfig.keyId,
      },
    };

    let privateKey: string = this.authConfig.privateKeys["key"];
    privateKey = cleanupKey(privateKey) ?? "";

    return jwt.sign(jwtBody, privateKey, jwtOptions);
  }

  public generateAuthRefreshToken(authRefreshTokenConfig: AuthRefreshTokenConfig): string {
    const jwtBody = {
      ...authRefreshTokenConfig,
    };

    const jwtOptions: SignOptions = {
      expiresIn: `${this.authConfig.refreshTokenExpiryDurationMinutes}m`,
      algorithm: "RS512",
      header: {
        alg: "RS512",
        kid: this.authConfig.keyId,
      },
    };

    let privateKey: string = this.authConfig.privateKeys["key"];

    privateKey = cleanupKey(privateKey) ?? "";

    return jwt.sign(jwtBody, privateKey, jwtOptions);
  }
}
