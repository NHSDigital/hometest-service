import { AwsSecretsClient } from "../lib/secrets/secrets-manager-client";
import { AuthTokenVerifier } from "../lib/auth/auth-token-verifier";
import { retrieveMandatoryEnvVariable, retrieveOptionalEnvVariable } from "../lib/utils";

interface SessionEnvVariables {
  authCookieKeyId: string;
  authCookiePublicKeySecretName: string;
}

interface SessionLambdaDependencies {
  authTokenVerifier: AuthTokenVerifier;
}

const envVars: SessionEnvVariables = {
  authCookieKeyId: retrieveOptionalEnvVariable("AUTH_COOKIE_KEY_ID", "key"),

  authCookiePublicKeySecretName: retrieveMandatoryEnvVariable(
    "AUTH_COOKIE_PUBLIC_KEY_SECRET_NAME",
  ),
};

export async function init(): Promise<SessionLambdaDependencies> {
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

  return { authTokenVerifier };
}
