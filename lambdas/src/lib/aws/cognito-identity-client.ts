import { type Commons } from '../commons';
import {
  GetOpenIdTokenForDeveloperIdentityCommand,
  type CognitoIdentityClient
} from '@aws-sdk/client-cognito-identity';
import { AWSService } from '../aws-service';

export interface ICognitoIdentityResponse {
  token: string;
  identityId: string;
}

interface ICognitoIdentityService {
  getOpenIdToken: (
    identityProviderName: string,
    userIdentifier: string
  ) => Promise<ICognitoIdentityResponse>;
}

export class CognitoIdentityService
  extends AWSService<CognitoIdentityClient>
  implements ICognitoIdentityService
{
  readonly authSessionMaxDurationMinutes: number;
  readonly identityPoolId: string;
  readonly developerProviderName: string;

  constructor(
    commons: Commons,
    cognitoIdentityClient: CognitoIdentityClient,
    authSessionMaxDurationMinutes: number,
    identityPoolId: string,
    developerProviderName: string
  ) {
    super(commons, 'CognitoIdentityService', cognitoIdentityClient);
    this.authSessionMaxDurationMinutes = authSessionMaxDurationMinutes;
    this.identityPoolId = identityPoolId;
    this.developerProviderName = developerProviderName;
  }

  async getOpenIdToken(
    userIdentifier: string,
    identityId?: string
  ): Promise<ICognitoIdentityResponse> {
    try {
      this.logger.info(
        'about to send GetOpenIdTokenForDeveloperIdentityCommand request'
      );
      const input = {
        IdentityPoolId: this.identityPoolId,
        Logins: {
          [this.developerProviderName]: userIdentifier
        },
        TokenDuration: this.authSessionMaxDurationMinutes * 60,
        ...(identityId && { IdentityId: identityId })
      };
      const command = new GetOpenIdTokenForDeveloperIdentityCommand(input);
      const response = await this.client.send(command);
      if (response.Token === undefined || response.IdentityId === undefined) {
        throw new Error(
          'Token or IdentityId is missing from the GetOpenIdTokenForDeveloperIdentityCommand response'
        );
      }
      return { token: response.Token, identityId: response.IdentityId };
    } catch (error) {
      this.logger.error(
        'GetOpenIdTokenForDeveloperIdentityCommand request failed',
        { error }
      );
      throw error;
    }
  }
}
