import { Commons } from '../../../src/lib/commons';
import Sinon from 'ts-sinon';
import {
  CognitoIdentityClient,
  type GetOpenIdTokenForDeveloperIdentityCommandOutput
} from '@aws-sdk/client-cognito-identity';
import { CognitoIdentityService } from '../../../src/lib/aws/cognito-identity-client';

describe('CognitoIdentityService tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let cognitoIdentityClientStub: Sinon.SinonStubbedInstance<CognitoIdentityClient>;
  let service: CognitoIdentityService;

  const authSessionMaxDurationMinutes = 15;
  const identityPoolId = 'pool-id';
  const developerProviderName = 'provider';
  const userIdentifier = 'user-id';
  const expectedErrorMessage =
    'Token or IdentityId is missing from the GetOpenIdTokenForDeveloperIdentityCommand response';

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    cognitoIdentityClientStub = sandbox.createStubInstance(
      CognitoIdentityClient
    );

    service = new CognitoIdentityService(
      commonsStub as unknown as Commons,
      cognitoIdentityClientStub as unknown as CognitoIdentityClient,
      authSessionMaxDurationMinutes,
      identityPoolId,
      developerProviderName
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('getOpenIdToken method', () => {
    test('should return token and identityId', async () => {
      const clientResponse: GetOpenIdTokenForDeveloperIdentityCommandOutput = {
        Token: 'abcd1',
        IdentityId: 'identity'
      } as unknown as GetOpenIdTokenForDeveloperIdentityCommandOutput;

      cognitoIdentityClientStub.send.resolves(clientResponse);

      const response = await service.getOpenIdToken(userIdentifier);

      expect(cognitoIdentityClientStub.send.calledOnce).toBeTruthy();
      expect(
        cognitoIdentityClientStub.send.getCall(0).args[0].input
      ).toMatchObject({
        IdentityPoolId: identityPoolId,
        Logins: {
          [developerProviderName]: userIdentifier
        },
        TokenDuration: authSessionMaxDurationMinutes * 60
      });
      expect(response).toMatchObject({
        token: clientResponse.Token,
        identityId: clientResponse.IdentityId
      });
    });

    test('should use identityId when it was passed as parameter', async () => {
      const identityId = 'identity';
      const clientResponse: GetOpenIdTokenForDeveloperIdentityCommandOutput = {
        Token: 'abcd1',
        IdentityId: identityId
      } as unknown as GetOpenIdTokenForDeveloperIdentityCommandOutput;

      cognitoIdentityClientStub.send.resolves(clientResponse);

      const response = await service.getOpenIdToken(userIdentifier, identityId);

      expect(cognitoIdentityClientStub.send.calledOnce).toBeTruthy();
      expect(
        cognitoIdentityClientStub.send.getCall(0).args[0].input
      ).toMatchObject({
        IdentityPoolId: identityPoolId,
        Logins: {
          [developerProviderName]: userIdentifier
        },
        TokenDuration: authSessionMaxDurationMinutes * 60,
        IdentityId: identityId
      });
      expect(response).toMatchObject({
        token: clientResponse.Token,
        identityId: clientResponse.IdentityId
      });
    });

    test('should throw error when Token is missing', async () => {
      const exception = new Error(expectedErrorMessage);
      const clientResponse: GetOpenIdTokenForDeveloperIdentityCommandOutput = {
        IdentityId: 'identity'
      } as unknown as GetOpenIdTokenForDeveloperIdentityCommandOutput;

      cognitoIdentityClientStub.send.resolves(clientResponse);

      await expect(service.getOpenIdToken(userIdentifier)).rejects.toThrow(
        exception
      );
      expect(cognitoIdentityClientStub.send.calledOnce).toBeTruthy();
    });

    test('should throw error when IdentityId is missing', async () => {
      const exception = new Error(expectedErrorMessage);
      const clientResponse: GetOpenIdTokenForDeveloperIdentityCommandOutput = {
        Token: 'abcd1'
      } as unknown as GetOpenIdTokenForDeveloperIdentityCommandOutput;

      cognitoIdentityClientStub.send.resolves(clientResponse);

      await expect(service.getOpenIdToken(userIdentifier)).rejects.toThrow(
        exception
      );
      expect(cognitoIdentityClientStub.send.calledOnce).toBeTruthy();
    });

    test('should rethrow error when cognito client throws error', async () => {
      const exception = new Error('Test error');
      cognitoIdentityClientStub.send.throwsException(exception);

      await expect(service.getOpenIdToken(userIdentifier)).rejects.toThrow(
        exception
      );

      sandbox.assert.calledWith(
        commonsStub.logError,
        'CognitoIdentityService',
        'GetOpenIdTokenForDeveloperIdentityCommand request failed',
        { error: exception }
      );
    });
  });
});
