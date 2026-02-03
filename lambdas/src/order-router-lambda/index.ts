import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from 'aws-lambda';
import {GetSecretValueCommand, SecretsManagerClient} from '@aws-sdk/client-secrets-manager';

const name = 'order-router-lambda';

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

const getRegion = (): string => {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-west-1';
};

const secretsClient = new SecretsManagerClient({region: getRegion()});

const getClientSecret = async (secretName: string): Promise<string> => {
  const response = await secretsClient.send(
    new GetSecretValueCommand({SecretId: secretName})
  );

  if (!response.SecretString) {
    throw new Error('Secret string is empty');
  }

  try {
    const parsed = JSON.parse(response.SecretString) as {client_secret?: string};
    if (!parsed.client_secret) {
      throw new Error('client_secret missing in secret JSON');
    }
    return parsed.client_secret;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return response.SecretString;
    }
    throw error;
  }
};

export const handler = async (_event: APIGatewayProxyEvent, _context: Context): Promise<APIGatewayProxyResult> => {

  try {
    const baseUrl = process.env.SUPPLIER_BASE_URL;
    const tokenPath = process.env.SUPPLIER_OAUTH_TOKEN_PATH || '/oauth/token';
    const clientId = process.env.SUPPLIER_CLIENT_ID;
    const secretName = process.env.SUPPLIER_CLIENT_SECRET_NAME;

    if (!baseUrl || !clientId || !secretName) {
      return {
        statusCode: 500,
        body: JSON.stringify({message: `${name}: Missing required configuration`}),
      };
    }

    const clientSecret = await getClientSecret(secretName);

    const tokenUrl = `${baseUrl.replace(/\/$/, '')}${tokenPath}`;
    const formBody = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });

    const responseText = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json';

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {'Content-Type': contentType},
        body: responseText,
      };
    }

    let body: OAuthTokenResponse | string = responseText;
    if (contentType.includes('application/json')) {
      body = JSON.parse(responseText) as OAuthTokenResponse;
    }

    return {
      statusCode: response.status,
      headers: {'Content-Type': contentType},
      body: typeof body === 'string' ? body : JSON.stringify(body),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({message: `${name}: ${error instanceof Error ? error.message : 'Unknown error'}`}),
    };
  }
};
