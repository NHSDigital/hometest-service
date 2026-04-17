import jwt, {
  JsonWebTokenError,
  type JwtHeader,
  type JwtPayload,
  TokenExpiredError,
  type VerifyOptions,
} from "jsonwebtoken";

import {
  type IAccessTokenPayload,
  type IRefreshTokenPayload,
} from "../models/auth/session-token-payload";
import { cleanupKey } from "./auth-utils";

export type SessionTokenVerifierErrorCode =
  | "INVALID_ALGORITHM"
  | "INVALID_SIGNATURE"
  | "TOKEN_EXPIRED"
  | "MALFORMED_TOKEN"
  | "UNKNOWN_KEY";

export interface SessionTokenVerifierError {
  code: SessionTokenVerifierErrorCode;
  message: string;
}

export interface SessionTokenVerificationSuccess<TPayload extends JwtPayload> {
  success: true;
  payload: TPayload;
  header: JwtHeader;
}

export interface SessionTokenVerificationFailure {
  success: false;
  error: SessionTokenVerifierError;
}

export type SessionTokenVerificationResult<TPayload extends JwtPayload> =
  | SessionTokenVerificationSuccess<TPayload>
  | SessionTokenVerificationFailure;

export interface SessionTokenVerifierConfig {
  publicKeys: Record<string, string>;
  keyId?: string;
}

type SessionAccessTokenClaims = IAccessTokenPayload & JwtPayload;
type SessionRefreshTokenClaims = IRefreshTokenPayload & JwtPayload;

export interface ISessionTokenVerifier {
  verifyAccessToken: (
    encodedToken: string,
    verifyOptions?: VerifyOptions,
  ) => Promise<SessionTokenVerificationResult<SessionAccessTokenClaims>>;
  verifyRefreshToken: (
    encodedToken: string,
    verifyOptions?: VerifyOptions,
  ) => Promise<SessionTokenVerificationResult<SessionRefreshTokenClaims>>;
}

export class SessionTokenVerifier implements ISessionTokenVerifier {
  private readonly config: SessionTokenVerifierConfig;

  constructor(config: SessionTokenVerifierConfig) {
    this.config = config;
  }

  public verifyAccessToken(
    encodedToken: string,
    verifyOptions?: VerifyOptions,
  ): Promise<SessionTokenVerificationResult<SessionAccessTokenClaims>> {
    return this.verifyToken<SessionAccessTokenClaims>(encodedToken, verifyOptions);
  }

  public verifyRefreshToken(
    encodedToken: string,
    verifyOptions?: VerifyOptions,
  ): Promise<SessionTokenVerificationResult<SessionRefreshTokenClaims>> {
    return this.verifyToken<SessionRefreshTokenClaims>(encodedToken, verifyOptions);
  }

  private async verifyToken<TPayload extends JwtPayload>(
    encodedToken: string,
    verifyOptions?: VerifyOptions,
  ): Promise<SessionTokenVerificationResult<TPayload>> {
    const decodedToken = jwt.decode(encodedToken, { complete: true });

    if (!decodedToken || typeof decodedToken === "string" || !decodedToken.header) {
      return {
        success: false,
        error: {
          code: "MALFORMED_TOKEN",
          message: "Token is malformed",
        },
      };
    }

    const publicKey = this.resolvePublicKey(decodedToken.header);

    if (!publicKey) {
      return {
        success: false,
        error: {
          code: "UNKNOWN_KEY",
          message: "No public key is configured for the token",
        },
      };
    }

    const jwtOptions: VerifyOptions = {
      algorithms: ["RS512"],
      ...verifyOptions,
    };

    try {
      const verifiedToken = jwt.verify(encodedToken, publicKey, jwtOptions);

      if (typeof verifiedToken === "string") {
        return {
          success: false,
          error: {
            code: "MALFORMED_TOKEN",
            message: "Token payload is malformed",
          },
        };
      }

      return {
        success: true,
        payload: verifiedToken as TPayload,
        header: decodedToken.header,
      };
    } catch (error) {
      return {
        success: false,
        error: this.mapVerificationError(error),
      };
    }
  }

  private resolvePublicKey(header: JwtHeader): string | undefined {
    const keyId = this.resolveKeyId(header);

    if (!keyId) {
      return undefined;
    }

    const publicKey = this.config.publicKeys[keyId];

    if (!publicKey) {
      return undefined;
    }

    return cleanupKey(publicKey) ?? publicKey;
  }

  private resolveKeyId(header: JwtHeader): string | undefined {
    // Key selection prefers the token's kid, then an explicitly configured default,
    // and finally the sole configured key when rotation is not in use.
    if (typeof header.kid === "string" && header.kid.length > 0) {
      return header.kid;
    }

    if (this.config.keyId) {
      return this.config.keyId;
    }

    const configuredKeyIds = Object.keys(this.config.publicKeys);

    if (configuredKeyIds.length === 1) {
      return configuredKeyIds[0];
    }

    return undefined;
  }

  private mapVerificationError(error: unknown): SessionTokenVerifierError {
    if (error instanceof TokenExpiredError) {
      return {
        code: "TOKEN_EXPIRED",
        message: error.message,
      };
    }

    if (error instanceof JsonWebTokenError) {
      const errorCode = this.mapJsonWebTokenErrorCode(error.message);

      return {
        code: errorCode,
        message: error.message,
      };
    }

    return {
      code: "MALFORMED_TOKEN",
      message: "Token verification failed",
    };
  }

  private mapJsonWebTokenErrorCode(message: string): SessionTokenVerifierErrorCode {
    if (message === "invalid algorithm") {
      return "INVALID_ALGORITHM";
    }

    if (message === "invalid signature") {
      return "INVALID_SIGNATURE";
    }

    return "MALFORMED_TOKEN";
  }
}
