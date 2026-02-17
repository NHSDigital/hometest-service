import jwt, { type Jwt } from 'jsonwebtoken';
import { type INhsLoginClient } from './nhs-login-client';
import { type INhsLoginConfig } from '../models/nhs-login/nhs-login-config';

export interface ITokenService {
  verifyToken: (encodedToken: string) => Promise<Jwt>;
}

// ALPHA: Removed commons use. To be reintroduced for logging later.
export class TokenService implements ITokenService {
  private readonly nhsLoginConfig: INhsLoginConfig;
  private readonly nhsLoginClient: INhsLoginClient;

  constructor(
    nhsLoginClient: INhsLoginClient,
    nhsLoginConfig: INhsLoginConfig
  ) {
    this.nhsLoginConfig = nhsLoginConfig;
    this.nhsLoginClient = nhsLoginClient;
  }

  public async verifyToken(encodedToken: string): Promise<Jwt> {
    try {
      const decodedToken = this.decodeToken(encodedToken);
      const tokenKid = decodedToken.header.kid;
      if (tokenKid === undefined) {
        throw new Error('kid is not present in the decoded token');
      }
      const publicSigningKey =
        await this.nhsLoginClient.fetchPublicKeyById(tokenKid);

      if (publicSigningKey === undefined) {
        throw new Error('public key not found');
      }

      const verifiedToken = jwt.verify(encodedToken, publicSigningKey, {
        algorithms: ['RS512'],
        issuer: this.nhsLoginConfig.baseUri,
        complete: true
      });

      if (verifiedToken !== null) {
        return verifiedToken;
      }
      throw new Error('token could not be verified');
    } catch (error) {
      throw error;
    }
  }

  private decodeToken(encodedToken: string): Jwt {
    try {
      const decodedToken = jwt.decode(encodedToken, { complete: true });
      if (decodedToken === null) {
        throw new Error('token could not be decoded');
      } else {
        return decodedToken;
      }
    } catch (error) {
      throw error;
    }
  }
}
