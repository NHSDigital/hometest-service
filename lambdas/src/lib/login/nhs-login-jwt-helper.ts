import jwt, { type SignOptions } from 'jsonwebtoken';
import { type INhsLoginConfig } from '../models/nhs-login/nhs-login-config';
import { v4 as uuidv4 } from 'uuid';

export interface INhsLoginJwtHelper {
  createClientAuthJwt: () => string;
}

// ALPHA: Removed commons use. To be reintroduced for logging later.
export class NhsLoginJwtHelper implements INhsLoginJwtHelper {
  readonly nhsLoginConfig: INhsLoginConfig;

  constructor(nhsLoginConfig: INhsLoginConfig) {
    this.nhsLoginConfig = nhsLoginConfig;
  }

  public createClientAuthJwt(): string {
    const clientTokenSignOptions: SignOptions = {
      // RS512 is required for NHS Login private_key_jwt client authentication.
      algorithm: 'RS512',
      // Both subject and issuer must equal the client_id per the OIDC spec for
      // private_key_jwt — this proves the assertion was created by this client.
      subject: this.nhsLoginConfig.clientId,
      issuer: this.nhsLoginConfig.clientId,
      audience: `${this.nhsLoginConfig.baseUri}/token`,
      // Unique JWT ID prevents replay attacks; NHS Login rejects re-used jwtids.
      jwtid: uuidv4(),
      expiresIn: this.nhsLoginConfig.expiresIn
    };

    try {
      // Empty payload is intentional — all required claims are expressed as
      // SignOptions above and are placed in the JWT header/registered claims.
      const signedToken = jwt.sign(
        {},
        this.nhsLoginConfig.privateKey,
        clientTokenSignOptions
      );
      return signedToken;
    } catch (error) {
      throw error;
    }
  }
}
