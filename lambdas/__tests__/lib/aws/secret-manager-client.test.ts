import Sinon from 'ts-sinon';
import { SecretManagerClient } from '../../../src/lib/aws/secret-manager-client';
import { Commons } from '../../../src/lib/commons';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

describe('secrets-manager-client', () => {
  const sandbox = Sinon.createSandbox();

  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let secretsManagerClientStub: Sinon.SinonStubbedInstance<SecretsManagerClient>;
  let secretManagerClient: SecretManagerClient;

  const secretName = 'test-secret';
  const secretValue = 'test-value';
  const secretKey = 'key';

  beforeEach(() => {
    commonsStub = Sinon.createStubInstance(Commons);
    secretsManagerClientStub = Sinon.createStubInstance(SecretsManagerClient);
    secretManagerClient = new SecretManagerClient(
      commonsStub as unknown as Commons,
      secretsManagerClientStub as unknown as SecretsManagerClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('getSecretValue', () => {
    it('should get secret value', async () => {
      secretsManagerClientStub.send.resolves({
        SecretString: secretValue
      });
      const result = await secretManagerClient.getSecretValue(secretName);
      expect(result).toEqual(secretValue);
    });

    it('should throw error if secret value could not be faetched', async () => {
      secretsManagerClientStub.send.resolves({
        SecretString: null
      });
      await expect(
        secretManagerClient.getSecretValue(secretName)
      ).rejects.toThrow('secret value could not be retrieved');
    });
  });

  describe('getSecretKeyValuePair', () => {
    it('should get secret key value pair', async () => {
      const response = {
        [secretKey]: secretValue
      };
      secretsManagerClientStub.send.resolves({
        SecretString: JSON.stringify(response)
      });
      const result =
        await secretManagerClient.getSecretKeyValuePair(secretName);
      expect(result).toEqual(response);
    });
  });

  describe('updateSecretKeyValuePair', () => {
    it('should update secret key value pair', async () => {
      const response = {
        [secretKey]: secretValue
      };
      const expectedValue = {
        [secretKey]: secretValue
      };

      secretsManagerClientStub.send.resolves({
        SecretString: JSON.stringify(response)
      });
      await secretManagerClient.updateSecretKeyValuePair(
        secretName,
        secretKey,
        secretValue
      );

      expect(
        secretsManagerClientStub.send.getCall(1).args[0].input
      ).toMatchObject({
        SecretId: secretName,
        SecretString: JSON.stringify(expectedValue)
      });
    });
    it('should throw error if secret is not a string or is missing', async () => {
      secretsManagerClientStub.send.resolves({
        SecretString: null
      });
      await expect(
        secretManagerClient.updateSecretKeyValuePair(
          secretName,
          secretKey,
          secretValue
        )
      ).rejects.toThrow('secret value could not be retrieved');
    });
  });
});
