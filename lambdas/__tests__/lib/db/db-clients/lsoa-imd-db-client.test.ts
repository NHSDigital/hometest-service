import { Commons } from '../../../../src/lib/commons';
import { DbClient } from '../../../../src/lib/db/db-client';
import { LsoaImdDbClient } from '../../../../src/lib/db/db-clients/lsoa-imd-db-client';
import { DbTable } from '../../../../src/lib/db/db-tables';
import { type ILsoaImd } from '../../../../src/lib/models/deprivation-score/lsoa-imd';
import Sinon from 'ts-sinon';

describe('LsoaImdDbClient', () => {
  const sandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let service: LsoaImdDbClient;

  const testLsoaCode = 'E01000001';
  const testImdRecord: ILsoaImd = {
    lsoaCode: testLsoaCode,
    imdDecile: 2,
    imdRank: 1234,
    imdScore: 30.5
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);
    service = new LsoaImdDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getLsoaImd', () => {
    test('should return undefined if no record is found', async () => {
      dbClientStub.getOptionalRecordById.resolves(undefined);

      const result = await service.getLsoaImd(testLsoaCode);

      expect(result).toBeUndefined();
      sandbox.assert.calledOnceWithExactly(dbClientStub.getOptionalRecordById, {
        table: DbTable.LsoaImd,
        partitionKeyValue: testLsoaCode
      });
    });

    test('should return record if found', async () => {
      dbClientStub.getOptionalRecordById.resolves(testImdRecord);

      const result = await service.getLsoaImd(testLsoaCode);

      expect(result).toEqual(testImdRecord);
      sandbox.assert.calledOnceWithExactly(dbClientStub.getOptionalRecordById, {
        table: DbTable.LsoaImd,
        partitionKeyValue: testLsoaCode
      });
    });

    test('should throw error if db client throws', async () => {
      const error = new Error('Database error');
      dbClientStub.getOptionalRecordById.throwsException(error);

      await expect(service.getLsoaImd(testLsoaCode)).rejects.toThrow(error);

      sandbox.assert.calledOnceWithExactly(dbClientStub.getOptionalRecordById, {
        table: DbTable.LsoaImd,
        partitionKeyValue: testLsoaCode
      });
    });
  });
});
