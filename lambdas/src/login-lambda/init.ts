import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { NhsLoginClient } from "../lib/login/nhs-login-client";
import { TokenService } from "../lib/login/token-service";
import { type INhsLoginConfig } from "../lib/models/nhs-login/nhs-login-config";
import { NhsLoginJwtHelper } from "../lib/login/nhs-login-jwt-helper";
import { retrieveMandatoryEnvVariable } from "../lib/utils/utils";
import { HttpClient } from "../lib/http/login-http-client";
import { AuthTokenService } from "../lib/auth/auth-token-service";
import {
  type ILoginService,
  LoginService,
  type LoginServiceParams,
} from "./login-service";
import { JwksClient } from "jwks-rsa";

// ALPHA: This file will need revisiting.
const envVars: LoginEnvVariables = {
  // ALPHA: Uncomment when environment variables are properly set up. Currently using hardcoded values for development and testing.
  nhsLoginBaseEndpointUrl: retrieveMandatoryEnvVariable(
    "NHS_LOGIN_BASE_ENDPOINT_URL",
  ),
  nhsLoginClientId: retrieveMandatoryEnvVariable("NHS_LOGIN_CLIENT_ID"),
  nhsLoginRedirectUrl: retrieveMandatoryEnvVariable("NHS_LOGIN_REDIRECT_URL"),
  nhsLoginPrivateKeySecretName: retrieveMandatoryEnvVariable(
    "NHS_LOGIN_PRIVATE_KEY_SECRET_NAME",
  ),
  // ALPHA: Uncomment when authCookiePrivateKeySecret is properly retrieved.
  // authCookiePrivateKeysSecretName: retrieveMandatoryEnvVariable(
  //   'AUTH_COOKIE_PRIVATE_KEYS_SECRET_NAME'
  // ),
  authSessionMaxDurationMinutes: Number.parseInt(
    retrieveMandatoryEnvVariable("AUTH_SESSION_MAX_DURATION_MINUTES"),
  ),
  authAccessTokenExpiryDurationMinutes: Number.parseInt(
    retrieveMandatoryEnvVariable("AUTH_ACCESS_TOKEN_EXPIRY_DURATION_MINUTES"),
  ),
  authRefreshTokenExpiryDurationMinutes: Number.parseInt(
    retrieveMandatoryEnvVariable("AUTH_REFRESH_TOKEN_EXPIRY_DURATION_MINUTES"),
  ),
};

interface LoginEnvVariables {
  nhsLoginBaseEndpointUrl: string;
  nhsLoginClientId: string;
  nhsLoginRedirectUrl: string;
  nhsLoginPrivateKeySecretName: string;
  // ALPHA: Uncomment when authCookiePrivateKeySecret is properly retrieved.
  // authCookiePrivateKeysSecretName: string;
  authSessionMaxDurationMinutes: number;
  authAccessTokenExpiryDurationMinutes: number;
  authRefreshTokenExpiryDurationMinutes: number;
}

interface LoginLambdaDependencies {
  loginService: ILoginService;
  authTokenService: AuthTokenService;
}

const className = "init";

// ALPHA: Removed commons temporarily.
export async function init(): Promise<LoginLambdaDependencies> {
  const secretManagerClient = new AwsSecretsClient(
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2",
  );
  const authCookiePrivateKeySecret = { key: "" } as Record<string, string>;
  // ALPHA: Requires a proper private key for cookie signing. Currently reusing nhs login key. Fix soon.
  // await secretManagerClient.getSecretKeyValuePair(
  // envVars.authCookiePrivateKeysSecretName
  // );

  const nhsLoginPrivateKey = await secretManagerClient.getSecretValue(
    envVars.nhsLoginPrivateKeySecretName,
  );

  // ALPHA: Remove when authCookiePrivateKeySecret is properly retrieved.
  authCookiePrivateKeySecret["key"] = nhsLoginPrivateKey;

  const authTokenService = new AuthTokenService({
    sessionMaxDurationMinutes: envVars.authSessionMaxDurationMinutes,
    accessTokenExpiryDurationMinutes:
      envVars.authAccessTokenExpiryDurationMinutes,
    refreshTokenExpiryDurationMinutes:
      envVars.authRefreshTokenExpiryDurationMinutes,
    privateKeys: authCookiePrivateKeySecret,
    publicKeys: {},
  });

  const nhsLoginConfig: INhsLoginConfig = {
    clientId: envVars.nhsLoginClientId,
    expiresIn: 60,
    redirectUri: envVars.nhsLoginRedirectUrl,
    baseUri: envVars.nhsLoginBaseEndpointUrl,
    privateKey: nhsLoginPrivateKey,
  };

  const nhsLoginJwtHelper: NhsLoginJwtHelper = new NhsLoginJwtHelper(
    nhsLoginConfig,
  );

  const httpClient = new HttpClient();
  const jwksClient = new JwksClient({
    cache: true,
    rateLimit: true,
    jwksUri: `${nhsLoginConfig.baseUri}/.well-known/jwks.json`,
  });
  const nhsLoginClient = new NhsLoginClient(
    nhsLoginConfig,
    nhsLoginJwtHelper,
    httpClient,
    jwksClient,
  );
  const tokenService = new TokenService(nhsLoginClient, nhsLoginConfig);

  const loginServiceParams: LoginServiceParams = {
    tokenService,
    nhsLoginClient,
    sessionMaxDurationMinutes: envVars.authSessionMaxDurationMinutes,
  };

  const loginService = new LoginService(loginServiceParams);

  return {
    loginService,
    authTokenService,
  };
}
