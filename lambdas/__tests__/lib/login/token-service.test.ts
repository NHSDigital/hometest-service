import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import jwt from 'jsonwebtoken';
import { TokenService } from '../../../src/lib/login/token-service';
import { type INhsLoginConfig } from '../../../src/lib/models/nhs-login/nhs-login-config';
import {
  NhsLoginClient,
  type INhsLoginClient
} from '../../../src/lib/login/nhs-login-client';

describe('TokenService tests', () => {
  const sandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let nhsLoginClientStub: Sinon.SinonStubbedInstance<INhsLoginClient>;
  let service: TokenService;
  const decodeSpy = jest.spyOn(jwt, 'decode');
  const verifySpy = jest.spyOn(jwt, 'verify');

  const testNhsLoginConfig: INhsLoginConfig = {
    clientId: '12334',
    expiresIn: 12314354,
    redirectUri: 'redirectUrl',
    baseUri: 'baseUrl',
    privateKey: 'private key content'
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    nhsLoginClientStub = sandbox.createStubInstance(NhsLoginClient);
    service = new TokenService(
      commonsStub as unknown as Commons,
      nhsLoginClientStub,
      testNhsLoginConfig
    );
  });

  afterEach(() => {
    sandbox.resetHistory();
    sandbox.reset();

    decodeSpy.mockReset();
    verifySpy.mockReset();
  });

  describe('verifyToken tests', () => {
    const sampleKid = '1234';
    const sampleEncodedToken = 'encodedToken';
    const sampleDecodedToken = {
      header: {
        kid: sampleKid
      }
    };
    const samplePublicSigningKey = 'signingKey';
    const sampleVerifiedToken = 'verifiedToken';

    test('When token is valid it should be successfully verified', async () => {
      decodeSpy.mockImplementation(() => sampleDecodedToken);
      verifySpy.mockImplementation(() => sampleVerifiedToken);

      nhsLoginClientStub.fetchPublicKeyById
        .withArgs(sampleKid)
        .resolves(samplePublicSigningKey);

      const result = await service.verifyToken(sampleEncodedToken);
      expect(result).toEqual(sampleVerifiedToken);
      expect(decodeSpy).toHaveBeenCalledWith(sampleEncodedToken, {
        complete: true
      });
      expect(verifySpy).toHaveBeenCalledWith(
        sampleEncodedToken,
        samplePublicSigningKey,
        {
          algorithms: ['RS512'],
          issuer: testNhsLoginConfig.baseUri,
          complete: true
        }
      );
    });

    async function ensureExceptionIsThrown(
      expectedException: string
    ): Promise<void> {
      await expect(service.verifyToken(sampleEncodedToken)).rejects.toThrow(
        expectedException
      );
    }

    test('When token cannot be decoded an error should be thrown', async () => {
      decodeSpy.mockImplementation(() => null);
      await ensureExceptionIsThrown('token could not be decoded');
    });

    test('When token kid is not provided in the decoded token an error should be thrown', async () => {
      const tokenWithNoKid = { header: { id: '123' } };
      decodeSpy.mockImplementation(() => tokenWithNoKid);
      await ensureExceptionIsThrown('kid is not present in the decoded token');
    });

    test('When public signing key cannot be fetched an error should be thrown', async () => {
      decodeSpy.mockImplementation(() => sampleDecodedToken);
      nhsLoginClientStub.fetchPublicKeyById
        .withArgs(sampleKid)
        .resolves(undefined);

      await ensureExceptionIsThrown('public key not found');
    });

    test('When token is docoded but its verification returns null an error should be thrown', async () => {
      decodeSpy.mockImplementation(() => sampleDecodedToken);
      verifySpy.mockImplementation(() => null);
      nhsLoginClientStub.fetchPublicKeyById
        .withArgs(sampleKid)
        .resolves(samplePublicSigningKey);

      await ensureExceptionIsThrown('token could not be verified');
    });
  });
});
