import { Commons } from '../../../../src/lib/commons';
import { DbClient, type IDbClient } from '../../../../src/lib/db/db-client';
import Sinon from 'ts-sinon';
import { DbTable } from '../../../../src/lib/db/db-tables';
import { SnomedCodesDbClient } from '../../../../src/lib/db/db-clients/snomed-codes-db-client';
import { type ISnomedCode } from '../../../../src/lib/models/snomed/snomed-code';

describe('SnomedCodesDbClient', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<IDbClient>;
  let service: SnomedCodesDbClient;

  const testSnomedCodes: ISnomedCode[] = [
    {
      id: 'id1',
      code: '1234'
    } as unknown as ISnomedCode,
    {
      id: 'id2',
      enabled: '1234'
    } as unknown as ISnomedCode
  ];

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);

    service = new SnomedCodesDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as IDbClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('getSnomedCodes', () => {
    it('Should call DB client with proper table and return an array of snomed codes if db call successful', async () => {
      dbClientStub.getAllRecords
        .withArgs({
          table: DbTable.Snomed
        })
        .resolves(testSnomedCodes);

      const snomedCodes = await service.getSnomedCodes();

      sandbox.assert.calledWith(dbClientStub.getAllRecords, {
        table: DbTable.Snomed
      });

      expect(snomedCodes).toEqual(testSnomedCodes);
    });

    it('Should throw an exception when error occurs', async () => {
      const error = new Error('an error occurred');
      dbClientStub.getAllRecords.throwsException(error);

      await expect(service.getSnomedCodes()).rejects.toThrow(error);

      sandbox.assert.calledWith(dbClientStub.getAllRecords, {
        table: DbTable.Snomed
      });
    });
  });

  describe('getSnomedCode', () => {
    const testSnomedRecord = {
      id: 'someTestCode',
      code: '12345'
    } as unknown as ISnomedCode;

    it('Should fetch correct code from correct table based on call params', async () => {
      dbClientStub.getRecordById.resolves(testSnomedRecord);

      const snomedCode = await service.getSnomedCode(testSnomedRecord.id);

      sandbox.assert.calledOnceWithExactly(dbClientStub.getRecordById, {
        table: DbTable.Snomed,
        partitionKeyValue: testSnomedRecord.id
      });

      expect(snomedCode).toEqual(testSnomedRecord);
    });

    it('Should throw an exception when error occurs', async () => {
      const error = new Error('error fetching record from database');
      dbClientStub.getRecordById.throwsException(error);

      await expect(service.getSnomedCode(testSnomedRecord.id)).rejects.toThrow(
        error
      );

      sandbox.assert.calledOnceWithExactly(dbClientStub.getRecordById, {
        table: DbTable.Snomed,
        partitionKeyValue: testSnomedRecord.id
      });
    });
  });
});
