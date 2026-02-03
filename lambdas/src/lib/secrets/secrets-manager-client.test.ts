const mockSend = jest.fn();

jest.mock('@aws-sdk/client-secrets-manager', () => {
  return {
    SecretsManagerClient: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    GetSecretValueCommand: jest.fn().mockImplementation((params) => params),
  };
});

import {getSecretString, getSecretValue} from './secrets-manager-client';

describe('secrets-manager-client', () => {
  beforeEach(() => {
    mockSend.mockReset();
    process.env.AWS_REGION = 'eu-west-1';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.AWS_REGION;
    delete process.env.AWS_DEFAULT_REGION;
  });

  describe('getSecretString', () => {
    it('should return secret string when present', async () => {
      mockSend.mockResolvedValue({SecretString: 'plain-secret'});

      const result = await getSecretString('my-secret');

      expect(result).toBe('plain-secret');
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({SecretId: 'my-secret'})
      );
    });

    it('should throw when secret string is empty', async () => {
      mockSend.mockResolvedValue({SecretString: ''});

      await expect(getSecretString('my-secret')).rejects.toThrow(
        'Secret string is empty'
      );
    });
  });

  describe('getSecretValue', () => {
    it('should return raw secret when no jsonKey provided', async () => {
      mockSend.mockResolvedValue({SecretString: 'raw-secret'});

      const result = await getSecretValue('my-secret');

      expect(result).toBe('raw-secret');
    });

    it('should return jsonKey value when secret is JSON', async () => {
      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({client_secret: 'json-secret'}),
      });

      const result = await getSecretValue('my-secret', {jsonKey: 'client_secret'});

      expect(result).toBe('json-secret');
    });

    it('should throw when jsonKey is missing', async () => {
      mockSend.mockResolvedValue({
        SecretString: JSON.stringify({other: 'value'}),
      });

      await expect(
        getSecretValue('my-secret', {jsonKey: 'client_secret'})
      ).rejects.toThrow('client_secret missing in secret JSON');
    });

    it('should return raw secret when secret is not JSON', async () => {
      mockSend.mockResolvedValue({SecretString: 'not-json'});

      const result = await getSecretValue('my-secret', {jsonKey: 'client_secret'});

      expect(result).toBe('not-json');
    });
  });
});