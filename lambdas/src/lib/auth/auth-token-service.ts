import jwt, { type SignOptions } from 'jsonwebtoken';
import { Service } from '../service';
import { type Commons } from '../commons';
import { type IAuthConfig } from '../models/auth/auth-config';
import {
  type AuthAccessTokenConfig,
  type AuthRefreshTokenConfig
} from '../models/auth/auth-token-config';
import { cleanupKey } from './auth-utils';

export interface IAuthTokenService {
  generateAuthAccessToken: (
    authAccessTokenConfig: AuthAccessTokenConfig
  ) => string;
  generateAuthRefreshToken: (
    authRefreshTokenConfig: AuthRefreshTokenConfig
  ) => string;
}

export class AuthTokenService extends Service implements IAuthTokenService {
  private readonly authConfig: IAuthConfig;

  constructor(commons: Commons, authConfig: IAuthConfig) {
    super(commons, 'AuthTokenService');
    this.authConfig = authConfig;
  }

  public generateAuthAccessToken(
    authAccessTokenConfig: AuthAccessTokenConfig
  ): string {
    const jwtBody = {
      ...authAccessTokenConfig
    };

    const jwtOptions: SignOptions = {
      expiresIn: `${this.authConfig.accessTokenExpiryDurationMinutes}m`,
      algorithm: 'RS512',
      header: {
        alg: 'RS512',
        kid: this.authConfig.keyId
      }
    };

    let privateKey: string = this.authConfig.privateKeys[this.authConfig.keyId];
    privateKey = cleanupKey(privateKey) ?? '';

    this.logger.info('about to sign jwt token');

    return jwt.sign(jwtBody, privateKey, jwtOptions);
  }

  public generateAuthRefreshToken(
    authRefreshTokenConfig: AuthRefreshTokenConfig
  ): string {
    const jwtBody = {
      ...authRefreshTokenConfig
    };

    const jwtOptions: SignOptions = {
      expiresIn: `${this.authConfig.refreshTokenExpiryDurationMinutes}m`,
      algorithm: 'RS512',
      header: {
        alg: 'RS512',
        kid: this.authConfig.keyId
      }
    };

    let privateKey: string = this.authConfig.privateKeys[this.authConfig.keyId];
    privateKey = cleanupKey(privateKey) ?? '';

    this.logger.info('about to sign jwt token');

    return jwt.sign(jwtBody, privateKey, jwtOptions);
  }
}
