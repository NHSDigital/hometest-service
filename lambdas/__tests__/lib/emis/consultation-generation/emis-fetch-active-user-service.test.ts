import Sinon from 'ts-sinon';
import { Commons } from '../../../../src/lib/commons';
import { EmisFetchActiveUserService } from '../../../../src/lib/emis/consultation-generation/emis-fetch-active-user-service';
import { OdsCodesDbClient } from '../../../../src/lib/db/db-clients/ods-codes-db-client';
import { LambdaClientService } from '../../../../src/lib/aws/lambda-client';
import { type IGpOdsCode } from '../../../../src/lib/models/ods-codes/ods-code';
import { type InvokeCommandOutput } from '@aws-sdk/client-lambda';

describe('EmisFetchActiveUserService', () => {
  const encoder = new TextEncoder();
  const getActiveUserLambdaName = 'getUser';
  const correlationId = 'mockCorrelationId';
  const sandbox = Sinon.createSandbox();
  const nhcVersion = 'nhcVersion';
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let odsCodesDbClientMock: Sinon.SinonStubbedInstance<OdsCodesDbClient>;
  let lambdaClientMock: Sinon.SinonStubbedInstance<LambdaClientService>;

  let service: EmisFetchActiveUserService;

  const mockOdsCode = 'LZ1234';
  const mockGpEmail = 'email@mock.gp';
  const mockGpName = 'mocked gp';
  const odsCodeFull: IGpOdsCode = {
    gpOdsCode: mockOdsCode,
    gpEmail: mockGpEmail,
    gpName: mockGpName,
    enabled: true,
    refId: 'refid',
    guid: 'guid',
    localAuthority: 'authority name'
  };
  const odsCode: IGpOdsCode = {
    gpOdsCode: mockOdsCode,
    gpEmail: mockGpEmail,
    gpName: mockGpName,
    enabled: true,
    localAuthority: 'authority name'
  };
  const lambdaResponse = {
    refId: 'refid',
    guid: 'guid'
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    odsCodesDbClientMock = sandbox.createStubInstance(OdsCodesDbClient);
    lambdaClientMock = sandbox.createStubInstance(LambdaClientService);
    commonsStub.nhcVersion = nhcVersion;

    odsCodesDbClientMock.getOdsCodeStatus.resolves(odsCodeFull);
    lambdaClientMock.invokeLambda.resolves({
      Payload: encoder.encode(JSON.stringify(lambdaResponse))
    } as unknown as InvokeCommandOutput);

    service = new EmisFetchActiveUserService(
      commonsStub as unknown as Commons,
      odsCodesDbClientMock,
      lambdaClientMock,
      getActiveUserLambdaName
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('fetchActiveUserDetails', () => {
    it('Calls get active user lambda, when refId and guid are not present in odsCodes table', async () => {
      odsCodesDbClientMock.getOdsCodeStatus.resolves(odsCode);

      const response = await service.fetchActiveUserDetails(
        mockOdsCode,
        correlationId
      );

      sandbox.assert.calledOnceWithExactly(
        odsCodesDbClientMock.getOdsCodeStatus,
        mockOdsCode
      );
      sandbox.assert.calledOnceWithExactly(
        lambdaClientMock.invokeLambda,
        getActiveUserLambdaName,
        { correlationId, odsCode: mockOdsCode }
      );

      expect(response).toEqual(lambdaResponse);
    });

    it('Fetches full active user details from odsCodes table  if available without calling lambda', async () => {
      const response = await service.fetchActiveUserDetails(
        mockOdsCode,
        correlationId
      );

      sandbox.assert.calledOnceWithExactly(
        odsCodesDbClientMock.getOdsCodeStatus,
        mockOdsCode
      );

      sandbox.assert.notCalled(lambdaClientMock.invokeLambda);
      expect(response).toEqual(lambdaResponse);
    });

    it('Throws error if lambda response payload is undefined', async () => {
      odsCodesDbClientMock.getOdsCodeStatus.resolves(odsCode);
      lambdaClientMock.invokeLambda.resolves({
        Payload: undefined
      } as unknown as InvokeCommandOutput);

      await expect(
        service.fetchActiveUserDetails(mockOdsCode, correlationId)
      ).rejects.toThrow('No payload returned from get active users lambda');

      sandbox.assert.calledOnceWithExactly(
        odsCodesDbClientMock.getOdsCodeStatus,
        mockOdsCode
      );
      sandbox.assert.calledOnceWithExactly(
        lambdaClientMock.invokeLambda,
        getActiveUserLambdaName,
        { correlationId, odsCode: mockOdsCode }
      );
    });

    it('Throws error if lambda response does not contain refId and guid', async () => {
      odsCodesDbClientMock.getOdsCodeStatus.resolves(odsCode);
      lambdaClientMock.invokeLambda.resolves({
        Payload: encoder.encode(JSON.stringify({}))
      } as unknown as InvokeCommandOutput);

      await expect(
        service.fetchActiveUserDetails(mockOdsCode, correlationId)
      ).rejects.toThrow('RefID and GUID not present in lambda response');

      sandbox.assert.calledOnceWithExactly(
        odsCodesDbClientMock.getOdsCodeStatus,
        mockOdsCode
      );
      sandbox.assert.calledOnceWithExactly(
        lambdaClientMock.invokeLambda,
        getActiveUserLambdaName,
        { correlationId, odsCode: mockOdsCode }
      );
    });
  });
});
