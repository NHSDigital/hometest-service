import { Commons } from '../../../../src/lib/commons';
import { DbClient } from '../../../../src/lib/db/db-client';
import Sinon from 'ts-sinon';
import { DbTable } from '../../../../src/lib/db/db-tables';
import { OdsCodesDbClient } from '../../../../src/lib/db/db-clients/ods-codes-db-client';
import { type IGpOdsCode } from '../../../../src/lib/models/ods-codes/ods-code';

describe('OdsCodesDbClient tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let service: OdsCodesDbClient;

  const mockGpEmail = 'email@mock.gp';
  const mockGpName = 'mocked gp';
  const mockLocalAuthority = 'mocked local authority';

  const testGpsOdsCodes: IGpOdsCode[] = [
    {
      gpOdsCode: '123ABC',
      gpEmail: mockGpEmail,
      gpName: mockGpName,
      enabled: true,
      localAuthority: mockLocalAuthority
    },
    {
      gpOdsCode: '456DEF',
      gpEmail: mockGpEmail,
      gpName: mockGpName,
      enabled: false,
      localAuthority: mockLocalAuthority
    }
  ];

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);

    service = new OdsCodesDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('getOdsCodes tests', () => {
    test('Should return array of GpOdsCode objects', async () => {
      dbClientStub.getAllRecords
        .withArgs({
          table: DbTable.GpOdsCodes,
          filterBy: { key: 'enabled', value: false }
        })
        .resolves(testGpsOdsCodes);

      const odsCodes = await service.getDisabledCodes();

      sandbox.assert.calledWith(dbClientStub.getAllRecords, {
        table: DbTable.GpOdsCodes,
        filterBy: { key: 'enabled', value: false }
      });

      expect(odsCodes).toEqual(testGpsOdsCodes);
    });

    test('When getting all disabled GpOdsCodes fails it should log and rethrow exception', async () => {
      const error = new Error('an error occurred');
      dbClientStub.getAllRecords.throwsException(error);

      await expect(service.getDisabledCodes()).rejects.toThrow(error);

      sandbox.assert.calledWith(dbClientStub.getAllRecords, {
        table: DbTable.GpOdsCodes,
        filterBy: { key: 'enabled', value: false }
      });
    });
  });

  describe('getOdsCodeStatus tests', () => {
    const testOdsCode = 'testCode';
    const testOdsRecord: IGpOdsCode = {
      gpOdsCode: testOdsCode,
      gpEmail: mockGpEmail,
      gpName: mockGpName,
      enabled: true,
      localAuthority: mockLocalAuthority
    };

    test('Should fetch code status based on code value when record present in database', async () => {
      dbClientStub.getRecordById
        .withArgs({
          table: DbTable.GpOdsCodes,
          partitionKeyValue: testOdsCode
        })
        .resolves(testOdsRecord);

      const odsCodeStatus = await service.getOdsCodeStatus(testOdsCode);

      sandbox.assert.calledOnceWithExactly(dbClientStub.getRecordById, {
        table: DbTable.GpOdsCodes,
        partitionKeyValue: testOdsCode
      });

      expect(odsCodeStatus).toEqual(testOdsRecord);
    });

    test('Should return disabled status when record is not present in database', async () => {
      const error = new Error('error fetching record from database');
      dbClientStub.getRecordById.throwsException(error);

      const odsCodeStatus = await service.getOdsCodeStatus(testOdsCode);

      sandbox.assert.calledOnceWithExactly(dbClientStub.getRecordById, {
        table: DbTable.GpOdsCodes,
        partitionKeyValue: testOdsCode
      });

      expect(odsCodeStatus).toEqual({ gpOdsCode: testOdsCode, enabled: false });
    });
  });

  describe('updateCode tests', () => {
    const testOdsCode = 'testCode';
    const updates = {
      refId: 'refId',
      guid: 'guid'
    };

    test('Should update ods code item with correct values', async () => {
      dbClientStub.updateRecordProperties.resolves();

      await service.updateCode(testOdsCode, updates);

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.updateRecordProperties,
        {
          table: DbTable.GpOdsCodes,
          partitionKeyValue: testOdsCode,
          updates
        }
      );
    });

    test('Should throw error when dbClient throws error', async () => {
      const error = new Error('error updating ods code');
      dbClientStub.updateRecordProperties.throwsException(error);

      await expect(service.updateCode(testOdsCode, updates)).rejects.toThrow(
        error
      );

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.updateRecordProperties,
        {
          table: DbTable.GpOdsCodes,
          partitionKeyValue: testOdsCode,
          updates
        }
      );
    });
  });
});
