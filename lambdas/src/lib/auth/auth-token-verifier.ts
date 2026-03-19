import jwt, { type JwtPayload, type VerifyOptions } from "jsonwebtoken";
import { cleanupKey } from "./auth-utils";

// ALPHA: This file will need revisiting.
export interface IAuthTokenVerifier {
  verifyToken: (encodedToken: string, verifyOptions?: VerifyOptions) => Promise<JwtPayload>;
}

export interface AuthTokenVerifierConfig {
  publicKeys: Record<string, string>;
  keyId: string;
}

export class AuthTokenVerifier implements IAuthTokenVerifier {
  private readonly publicKeys: Record<string, string>;
  private readonly keyId: string;

  constructor(config: AuthTokenVerifierConfig) {
    this.publicKeys = config.publicKeys;
    this.keyId = config.keyId;
  }

  public async verifyToken(
    encodedToken: string,
    verifyOptions?: VerifyOptions,
  ): Promise<JwtPayload> {
    const jwtOptions: VerifyOptions = {
      algorithms: ["RS512"],
      ...verifyOptions,
    };
    const decodedToken = jwt.decode(encodedToken, { complete: true });
    const kid: string = decodedToken?.header.kid ?? this.keyId;
    const publicKey: string = cleanupKey(this.publicKeys[kid]) ?? "";

    const verifiedToken = jwt.verify(encodedToken, publicKey, jwtOptions);
    return verifiedToken as JwtPayload;
  }
}
