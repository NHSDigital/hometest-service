import { Service } from '../service';
import { type Commons } from '../commons';
import { type HttpClient } from './http-client';

interface IThrivaAuthRequestModel {
  grant_type: string;
  client_id: string;
  client_secret: string;
  audience: string;
}

interface IThrivaAuthResponseModel {
  access_token: string;
  scope: string;
  expires_in: number;
  token_type: string;
}

export class ThrivaAuthHttpClient extends Service {
  private readonly httpClient: HttpClient;
  private readonly authApiUrl: string;
  private readonly apiUrl: string;
  private readonly audienceUrl: string;
  private readonly secretKey: string;
  private readonly clientId: string;

  constructor(
    commons: Commons,
    httpClient: HttpClient,
    authApiUrl: string,
    apiUrl: string,
    audienceUrl: string,
    secretKey: string,
    clientId: string
  ) {
    super(commons, 'ThrivaAuthHttpClient');
    this.httpClient = httpClient;
    this.authApiUrl = authApiUrl;
    this.apiUrl = apiUrl;
    this.audienceUrl = audienceUrl;
    this.secretKey = secretKey;
    this.clientId = clientId;
  }

  public async auth(): Promise<string> {
    try {
      const body: IThrivaAuthRequestModel = {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.secretKey,
        audience: this.audienceUrl
      };
      const response = await this.httpClient.postRequest<
        IThrivaAuthRequestModel,
        IThrivaAuthResponseModel
      >(`${this.authApiUrl}/oauth/token`, body);
      return response.access_token;
    } catch (error) {
      this.logger.error('The call to Thriva auth API ended with an error', {
        error
      });
      throw error;
    }
  }
}
