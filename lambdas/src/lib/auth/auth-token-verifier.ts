import jwt, { type JwtPayload, type VerifyOptions } from 'jsonwebtoken';
import { Service } from '../service';
import { type Commons } from '../commons';
import { cleanupKey } from './auth-utils';

export interface IAuthTokenVerifier {
  verifyToken: (
    encodedToken: string,
    verifyOptions?: VerifyOptions
  ) => Promise<JwtPayload>;
}

export interface AuthTokenVerifierConfig {
  publicKeys: Record<string, string>;
  keyId: string;
}

export class AuthTokenVerifier extends Service implements IAuthTokenVerifier {
  private readonly publicKeys: Record<string, string>;
  private readonly keyId: string;

  constructor(commons: Commons, config: AuthTokenVerifierConfig) {
    super(commons, 'AuthTokenVerifier');
    this.publicKeys = config.publicKeys;
    this.keyId = config.keyId;
  }

  public async verifyToken(
    encodedToken: string,
    verifyOptions?: VerifyOptions
  ): Promise<JwtPayload> {
    const jwtOptions: VerifyOptions = {
      algorithms: ['RS512'],
      ...verifyOptions
    };
    try {
      this.logger.debug('about to decode jwt token', {
        tokenPreview: encodedToken?.slice?.(0, 30)
      });

      const decodedToken = jwt.decode(encodedToken, { complete: true });
      const kid: string = decodedToken?.header.kid ?? this.keyId;
      const publicKey: string = cleanupKey(this.publicKeys[kid]) ?? '';

      this.logger.debug('about to verify jwt token');
      const verifiedToken = jwt.verify(encodedToken, publicKey, jwtOptions);
      this.logger.info('jwt token verified');
      return verifiedToken as JwtPayload;
    } catch (error) {
      this.logger.error('could not verify jwt token', { error }, true);
      throw error;
    }
  }
}
