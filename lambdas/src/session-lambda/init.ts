import { JwksClient } from "jwks-rsa";
import { HttpClient } from "src/lib/http/login-http-client";
import { NhsLoginClient } from "src/lib/login/nhs-login-client";
import { NhsLoginJwtHelper } from "src/lib/login/nhs-login-jwt-helper";
import { INhsLoginConfig } from "src/lib/models/nhs-login/nhs-login-config";

import { AuthTokenVerifier } from "../lib/auth/auth-token-verifier";
import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { retrieveMandatoryEnvVariable, retrieveOptionalEnvVariable } from "../lib/utils/utils";

interface SessionEnvVariables {
  authCookieKeyId: string;
  authCookiePublicKeySecretName: string;
  nhsLoginBaseEndpointUrl: string;
}

interface SessionLambdaDependencies {
  authTokenVerifier: AuthTokenVerifier;
  nhsLoginClient: NhsLoginClient;
}

const envVars: SessionEnvVariables = {
  authCookieKeyId: retrieveOptionalEnvVariable("AUTH_COOKIE_KEY_ID", "key"),

  authCookiePublicKeySecretName: retrieveMandatoryEnvVariable("AUTH_COOKIE_PUBLIC_KEY_SECRET_NAME"),

  // todo needs be removed after Alpha phase
  nhsLoginBaseEndpointUrl: retrieveMandatoryEnvVariable("NHS_LOGIN_BASE_ENDPOINT_URL"),
};

async function buildEnvironment(): Promise<SessionLambdaDependencies> {
  const secretManagerClient = new AwsSecretsClient(
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2",
  );

  const publicKeyOrPem = await secretManagerClient.getSecretValue(
    envVars.authCookiePublicKeySecretName,
  );

  const authTokenVerifier = new AuthTokenVerifier({
    keyId: envVars.authCookieKeyId,
    publicKeys: {
      [envVars.authCookieKeyId]: publicKeyOrPem,
    },
  });

  // todo needs be removed after Alpha phase
  // provided minimal dependencies only for getUserInfo method
  const nhsLoginClient = new NhsLoginClient(
    {
      baseUri: envVars.nhsLoginBaseEndpointUrl,
    } as INhsLoginConfig,
    {} as NhsLoginJwtHelper,
    new HttpClient(),
    {} as JwksClient,
  );

  return { authTokenVerifier, nhsLoginClient };
}

let _env: Promise<SessionLambdaDependencies> | undefined;

export function init(): Promise<SessionLambdaDependencies> {
  _env ??= buildEnvironment();
  return _env;
}
