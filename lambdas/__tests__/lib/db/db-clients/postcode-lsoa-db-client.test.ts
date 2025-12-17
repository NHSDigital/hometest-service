import { Commons } from '../../../../src/lib/commons';
import { DbClient } from '../../../../src/lib/db/db-client';
import { PostcodeLsoaDbClient } from '../../../../src/lib/db/db-clients/postcode-lsoa-db-client';
import { DbTable } from '../../../../src/lib/db/db-tables';
import { type IPostcodeLsoa } from '../../../../src/lib/models/deprivation-score/postcode-lsoa';
import Sinon from 'ts-sinon';

describe('PostcodeLsoaDbClient', () => {
  const sandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let service: PostcodeLsoaDbClient;

  const testPostcode = 'AB12 3CD';
  const strippedPostcode = 'AB123CD';
  const testLsoaRecord: IPostcodeLsoa = {
    postcode: strippedPostcode,
    lsoaCode: 'E01000001'
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);
    service = new PostcodeLsoaDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getPostcodeLsoaByPostcode', () => {
    test('should return undefined if postcode is not found in PostcodeLsoa table', async () => {
      dbClientStub.getOptionalRecordById.resolves(undefined);

      const result = await service.getPostcodeLsoa(testPostcode);

      expect(result).toBeUndefined();
      sandbox.assert.calledOnceWithExactly(dbClientStub.getOptionalRecordById, {
        table: DbTable.PostcodeLsoa,
        partitionKeyValue: strippedPostcode
      });
    });

    test('should proceed with result if LSOA code is found', async () => {
      dbClientStub.getOptionalRecordById.resolves(testLsoaRecord);

      const result = await service.getPostcodeLsoa(testPostcode);

      expect(result).toEqual(testLsoaRecord);
      sandbox.assert.calledOnceWithExactly(dbClientStub.getOptionalRecordById, {
        table: DbTable.PostcodeLsoa,
        partitionKeyValue: strippedPostcode
      });
    });

    test('should propagate error if db client throws while fetching postcode', async () => {
      const error = new Error('DB failure');
      dbClientStub.getOptionalRecordById.throwsException(error);

      await expect(service.getPostcodeLsoa(testPostcode)).rejects.toThrow(
        error
      );

      sandbox.assert.calledOnceWithExactly(dbClientStub.getOptionalRecordById, {
        table: DbTable.PostcodeLsoa,
        partitionKeyValue: strippedPostcode
      });
    });
  });
});
