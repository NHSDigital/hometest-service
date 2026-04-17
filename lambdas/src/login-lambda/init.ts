import { JwksClient } from "jwks-rsa";

import { AuthTokenService } from "../lib/auth/auth-token-service";
import { FetchHttpClient } from "../lib/http/http-client";
import { NhsLoginClient } from "../lib/login/nhs-login-client";
import { NhsLoginJwtHelper } from "../lib/login/nhs-login-jwt-helper";
import { TokenService } from "../lib/login/token-service";
import { type INhsLoginConfig } from "../lib/models/nhs-login/nhs-login-config";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import {
  retrieveMandatoryEnvVariable,
  retrieveOptionalEnvVariable,
  retrieveOptionalEnvVariableWithDefault,
} from "../lib/utils/utils";
import { type ILoginService, LoginService, type LoginServiceParams } from "./login-service";

interface LoginEnvVariables {
  awsRegion: string;
  nhsLoginBaseEndpointUrl: string;
  nhsLoginJwksUri: string | undefined;
  nhsLoginClientId: string;
  nhsLoginRedirectUrl: string;
  nhsLoginPrivateKeySecretName: string;
  authCookiePrivateKeysSecretName: string;
  authSessionMaxDurationMinutes: number;
  authAccessTokenExpiryDurationMinutes: number;
  authRefreshTokenExpiryDurationMinutes: number;
  authCookieSameSite: string;
  authCookieSecure: boolean;
}

function parseAuthCookiePrivateKeys(secretValue: string): Record<string, string> {
  try {
    const parsedSecret = JSON.parse(secretValue) as Record<string, unknown>;
    const privateKeys = Object.entries(parsedSecret).reduce<Record<string, string>>(
      (accumulator, [key, value]) => {
        if (typeof value === "string" && value.length > 0) {
          accumulator[key] = value;
        }

        return accumulator;
      },
      {},
    );

    if (typeof privateKeys.key === "string" && privateKeys.key.length > 0) {
      return privateKeys;
    }
    throw new Error(
      "AUTH_COOKIE_PRIVATE_KEYS_SECRET_NAME must be either a non-JSON private key string or a JSON object containing a non-empty 'key' entry.",
    );
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }
    // Non-JSON values are treated as a single key.
  }

  if (secretValue.trim().length === 0) {
    throw new Error("AUTH_COOKIE_PRIVATE_KEYS_SECRET_NAME secret value must not be empty.");
  }

  return {
    key: secretValue,
  };
}

export interface LoginLambdaDependencies {
  loginService: ILoginService;
  authTokenService: AuthTokenService;
  authCookieSameSite: string;
  authCookieSecure: boolean;
}

function loadEnv(): LoginEnvVariables {
  return {
    awsRegion: retrieveMandatoryEnvVariable("AWS_REGION"),
    nhsLoginBaseEndpointUrl: retrieveMandatoryEnvVariable("NHS_LOGIN_BASE_ENDPOINT_URL"),
    nhsLoginJwksUri: retrieveOptionalEnvVariable("NHS_LOGIN_JWKS_URI"),
    nhsLoginClientId: retrieveMandatoryEnvVariable("NHS_LOGIN_CLIENT_ID"),
    nhsLoginRedirectUrl: retrieveMandatoryEnvVariable("NHS_LOGIN_REDIRECT_URL"),
    nhsLoginPrivateKeySecretName: retrieveMandatoryEnvVariable("NHS_LOGIN_PRIVATE_KEY_SECRET_NAME"),
    authCookiePrivateKeysSecretName: retrieveMandatoryEnvVariable(
      "AUTH_COOKIE_PRIVATE_KEYS_SECRET_NAME",
    ),
    authSessionMaxDurationMinutes: Number.parseInt(
      retrieveMandatoryEnvVariable("AUTH_SESSION_MAX_DURATION_MINUTES"),
    ),
    authAccessTokenExpiryDurationMinutes: Number.parseInt(
      retrieveMandatoryEnvVariable("AUTH_ACCESS_TOKEN_EXPIRY_DURATION_MINUTES"),
    ),
    authRefreshTokenExpiryDurationMinutes: Number.parseInt(
      retrieveMandatoryEnvVariable("AUTH_REFRESH_TOKEN_EXPIRY_DURATION_MINUTES"),
    ),
    authCookieSameSite: retrieveMandatoryEnvVariable("AUTH_COOKIE_SAME_SITE"),
    authCookieSecure:
      retrieveOptionalEnvVariableWithDefault("AUTH_COOKIE_SECURE", "true").toLowerCase() === "true",
  };
}

export async function buildEnvironment(): Promise<LoginLambdaDependencies> {
  const envVars = loadEnv();
  const secretManagerClient = new AwsSecretsClient(envVars.awsRegion);
  const nhsLoginPrivateKey = await secretManagerClient.getSecretValue(
    envVars.nhsLoginPrivateKeySecretName,
  );
  const authCookiePrivateKeySecret = await secretManagerClient.getSecretValue(
    envVars.authCookiePrivateKeysSecretName,
  );

  const authTokenService = new AuthTokenService({
    sessionMaxDurationMinutes: envVars.authSessionMaxDurationMinutes,
    accessTokenExpiryDurationMinutes: envVars.authAccessTokenExpiryDurationMinutes,
    refreshTokenExpiryDurationMinutes: envVars.authRefreshTokenExpiryDurationMinutes,
    privateKeys: parseAuthCookiePrivateKeys(authCookiePrivateKeySecret),
    publicKeys: {},
  });

  const nhsLoginConfig: INhsLoginConfig = {
    clientId: envVars.nhsLoginClientId,
    expiresIn: 60,
    redirectUri: envVars.nhsLoginRedirectUrl,
    baseUri: envVars.nhsLoginBaseEndpointUrl,
    privateKey: nhsLoginPrivateKey,
    jwksUri: envVars.nhsLoginJwksUri || undefined,
  };

  const nhsLoginJwtHelper: NhsLoginJwtHelper = new NhsLoginJwtHelper(nhsLoginConfig);

  const httpClient = new FetchHttpClient();
  const jwksClient = new JwksClient({
    cache: true,
    rateLimit: true,
    jwksUri: nhsLoginConfig.jwksUri ?? `${nhsLoginConfig.baseUri}/.well-known/jwks.json`,
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
    authCookieSameSite: envVars.authCookieSameSite,
    authCookieSecure: envVars.authCookieSecure,
  };
}

let _env: Promise<LoginLambdaDependencies> | undefined;

export function init(): Promise<LoginLambdaDependencies> {
  _env ??= buildEnvironment().catch((error) => {
    // Clear cached environment on failure so subsequent calls can retry
    _env = undefined;
    throw error;
  });
  return _env;
}
