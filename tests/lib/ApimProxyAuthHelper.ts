import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { request } from '@playwright/test';
import { SecretManagerService } from './aws/SecretManagerService';
import { ConfigFactory } from '../env/config';

const config = ConfigFactory.getConfig();
export interface ApimAuthHeaders {
  Authorization: string;
  'X-Correlation-ID': string;
  'X-Message-Reference': string;
  'X-Message-Batch-Reference': string;
}
interface TokenResponse {
  access_token: string;
}

export interface AuthDetails {
  accessToken: string;
  messageBatchReference: string;
  messageReference: string;
  correlationId: string;
}

const isTokenResponse = (data: unknown): data is TokenResponse => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'access_token' in data &&
    typeof (data as TokenResponse).access_token === 'string'
  );
};

export const getApimProxyAuth = async (): Promise<AuthDetails> => {
  const envName = config.apimEnvName;
  if (!envName) {
    throw new Error('Environment variable APIM_ENV_NAME must be set.');
  }

  const validEnvs = ['internal-dev', 'internal-qa', 'int'];
  if (!validEnvs.includes(envName)) {
    throw new Error(
      `Invalid APIM_ENV_NAME. Must be one of: ${validEnvs.join(', ')}`
    );
  }

  const secretManager = new SecretManagerService();

  const [privateKey, apiKey] = await Promise.all([
    secretManager.getSecretValue(`nhc/apim-${envName}-consumer-private-key`),
    secretManager.getSecretValue(`nhc/apim-${envName}-consumer-api-key`)
  ]);

  const authUrl = `https://${envName}.api.service.nhs.uk/oauth2/token`;

  const header = {
    typ: 'JWT',
    alg: 'RS512',
    kid: 'dev-1'
  };

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const payload = {
    sub: apiKey,
    iss: apiKey,
    jti: uuidv4(),
    aud: authUrl,
    exp: currentTimestamp + 180
  };

  const signedJwt = jwt.sign(payload, privateKey, {
    algorithm: 'RS512',
    header
  });

  const requestContext = await request.newContext();
  try {
    const response = await requestContext.post(authUrl, {
      form: {
        grant_type: 'client_credentials',
        client_assertion_type:
          'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: signedJwt
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response.ok()) {
      throw new Error(`Authentication server error: ${response.status()}`);
    }

    const json: unknown = await response.json();

    if (!isTokenResponse(json)) {
      throw new Error('Invalid token response from authentication server.');
    }

    return {
      accessToken: json.access_token,
      messageBatchReference: uuidv4(),
      messageReference: uuidv4(),
      correlationId: uuidv4()
    };
  } catch {
    throw new Error('Authentication failed');
  } finally {
    await requestContext.dispose();
  }
};
