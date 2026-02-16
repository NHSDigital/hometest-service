/* eslint-disable @typescript-eslint/no-explicit-any */
import { type HttpClient } from '../http/login-http-client';
import { type INhsLoginConfig } from '../models/nhs-login/nhs-login-config';
import { type INhsTokenResponseModel } from '../models/nhs-login/nhs-login-token-response-model';
import { type INhsUserInfoResponseModel } from '../models/nhs-login/nhs-login-user-info-response-model';
import { type JwksClient } from 'jwks-rsa';
import { type NhsLoginJwtHelper } from './nhs-login-jwt-helper';

export interface INhsLoginClient {
  getUserTokens: (code: string) => Promise<INhsTokenResponseModel>;
  getUserInfo: (userAccessToken: string) => Promise<INhsUserInfoResponseModel>;
  fetchPublicKeyById: (kid: string) => Promise<string>;
}

// ALPHA: Removed commons use. To be reintroduced for logging later.
export class NhsLoginClient implements INhsLoginClient {
  private readonly nhsLoginConfig: INhsLoginConfig;
  private readonly nhsLoginJwtHelper: NhsLoginJwtHelper;
  private readonly nhsLoginTokenUri: string;
  private readonly nhsLoginUserInfoUri: string;
  private readonly jwksClient: JwksClient;
  private readonly httpClient: HttpClient;

  constructor(
    nhsLoginConfig: INhsLoginConfig,
    nhsLoginJwtHelper: NhsLoginJwtHelper,
    httpClient: HttpClient,
    jwksClient: JwksClient
  ) {
    this.nhsLoginConfig = nhsLoginConfig;
    this.nhsLoginJwtHelper = nhsLoginJwtHelper;
    this.nhsLoginTokenUri = `${nhsLoginConfig.baseUri}/token`;
    this.nhsLoginUserInfoUri = `${nhsLoginConfig.baseUri}/userinfo`;
    this.jwksClient = jwksClient;
    this.httpClient = httpClient;
  }

  public async getUserTokens(code: string): Promise<INhsTokenResponseModel> {
    const signedToken = this.nhsLoginJwtHelper.createClientAuthJwt();

    const formData = new URLSearchParams({
      code,
      client_id: this.nhsLoginConfig.clientId,
      redirect_uri: this.nhsLoginConfig.redirectUri,
      grant_type: 'authorization_code',
      client_assertion_type:
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: signedToken
    });

    console.log(formData.toString());

    const response: INhsTokenResponseModel =
      await this.httpClient.postRequest<URLSearchParams, any>(
        this.nhsLoginTokenUri,
        formData,
        {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      );
    return response;
  }

  public async getUserInfo(
    userAccessToken: string
  ): Promise<INhsUserInfoResponseModel> {
    const userInfoResponse =
      await this.httpClient.getRequest<INhsUserInfoResponseModel>(
        this.nhsLoginUserInfoUri,
        {
          Authorization: `Bearer ${userAccessToken}`
        }
      );
    return userInfoResponse;
  }

  public async fetchPublicKeyById(kid: string): Promise<string> {
    const response = await this.jwksClient.getSigningKey(kid);
    return response.getPublicKey();
  }
}
