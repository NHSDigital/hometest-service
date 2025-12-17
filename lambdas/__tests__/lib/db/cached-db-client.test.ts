import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import {
  DbClient,
  type BatchUpdateResult
} from '../../../src/lib/db/db-client';
import { CachedDbClient } from '../../../src/lib/db/cached-db-client';
import { DbTable } from '../../../src/lib/db/db-tables';
import NodeCache from 'node-cache';
import {
  type EntityUpdateParams,
  type EntityCreateParams,
  type EntityDeleteParams
} from '../../../src/lib/db/entity-update-params';
import { type IBatchInput } from '../../../src/lib/models/data-load/batch-input';

jest.mock('node-cache', () => {
  const mockSinon = require('sinon');
  return class MockCache {
    static readonly caches = {
      get: mockSinon.stub(),
      set: mockSinon.stub(),
      keys: mockSinon.stub(),
      del: mockSinon.stub()
    };

    get = MockCache.caches.get;
    set = MockCache.caches.set;
    keys = MockCache.caches.keys;
    del = MockCache.caches.del;
  };
});

describe('CachedDbClient', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  const mockDbEntries = [
    { id: 'id1', code: 'someCode1' },
    { id: 'id2', code: 'someCode2' },
    { id: 'id3', code: 'someCode3' },
    { id: 'id4', code: 'someCode2' }
  ];
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let service: CachedDbClient;
  const mockCache =
    new NodeCache() as unknown as Sinon.SinonStubbedInstance<NodeCache>;

  const resetMocks: () => void = () => {
    sandbox.reset();
    mockCache.get.reset();
    mockCache.set.reset();
    mockCache.keys.reset();
    mockCache.del.reset();
  };

  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(async () => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);
    dbClientStub.getAllRecords.resolves(mockDbEntries);

    service = new CachedDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
    void service.initCache(DbTable.Snomed);
    // waiting for all promises to resolve since caching is a not awaited background process
    await jest.runAllTimersAsync();

    // resetting mocks as the constructor will run a few of them
    resetMocks();

    dbClientStub.getAllRecords.resolves(mockDbEntries);
    dbClientStub.getTableDetails.callThrough();
  });

  afterEach(() => {
    resetMocks();
  });

  describe('constructor', () => {
    it('Should init table cache with correct data when table supplied', async () => {
      service = new CachedDbClient(
        commonsStub as unknown as Commons,
        dbClientStub as unknown as DbClient
      );
      void service.initCache(DbTable.Snomed);
      await jest.runAllTimersAsync();

      sandbox.assert.calledWith(
        mockCache.get,
        `${service.INIT_IN_PROGRESS_KEY_PREFIX}${DbTable.Snomed}`
      );
      sandbox.assert.calledWith(
        mockCache.set,
        `${service.INIT_IN_PROGRESS_KEY_PREFIX}${DbTable.Snomed}`,
        true
      );
      sandbox.assert.calledWith(dbClientStub.getAllRecords, {
        table: DbTable.Snomed
      });
      sandbox.assert.calledWith(mockCache.set, DbTable.Snomed, mockDbEntries);
      sandbox.assert.calledWith(
        mockCache.set,
        `${service.INIT_IN_PROGRESS_KEY_PREFIX}${DbTable.Snomed}`,
        false
      );
    });

    it('Should not init table cache if cache is already populated', async () => {
      mockCache.get.withArgs(DbTable.Snomed).returns(mockDbEntries);
      service = new CachedDbClient(
        commonsStub as unknown as Commons,
        dbClientStub as unknown as DbClient
      );
      void service.initCache(DbTable.Snomed);
      await jest.runAllTimersAsync();

      sandbox.assert.notCalled(dbClientStub.getAllRecords);
      sandbox.assert.neverCalledWith(
        mockCache.set,
        DbTable.Snomed,
        Sinon.match.any
      );
    });

    it('Should not init table cache if caching is in progress in another process for this table', async () => {
      mockCache.get
        .withArgs(`${service.INIT_IN_PROGRESS_KEY_PREFIX}${DbTable.Snomed}`)
        .returns(true);
      service = new CachedDbClient(
        commonsStub as unknown as Commons,
        dbClientStub as unknown as DbClient
      );
      void service.initCache(DbTable.Snomed);
      await jest.runAllTimersAsync();

      sandbox.assert.notCalled(dbClientStub.getAllRecords);
      sandbox.assert.neverCalledWith(
        mockCache.set,
        DbTable.Snomed,
        Sinon.match.any
      );
    });

    it('Should init table cache if caching is in progress in another process for a different table', async () => {
      mockCache.get
        .withArgs(`${service.INIT_IN_PROGRESS_KEY_PREFIX}${DbTable.GpOdsCodes}`)
        .returns(true);
      dbClientStub.getAllRecords.resolves(mockDbEntries);
      service = new CachedDbClient(
        commonsStub as unknown as Commons,
        dbClientStub as unknown as DbClient
      );
      void service.initCache(DbTable.Snomed);
      await jest.runAllTimersAsync();

      sandbox.assert.calledWith(dbClientStub.getAllRecords, {
        table: DbTable.Snomed
      });
      sandbox.assert.calledWith(mockCache.set, DbTable.Snomed, mockDbEntries);
    });
  });

  describe('getRecordsByPartitionKey', () => {
    it('Should fetch the entry from cache without a db call if cache available by main table key', async () => {
      mockCache.get.withArgs(DbTable.Snomed).returns(mockDbEntries);
      const result = await service.getRecordsByPartitionKey({
        table: DbTable.Snomed,
        partitionKeyValue: mockDbEntries[0].id
      });
      sandbox.assert.calledWith(mockCache.get, DbTable.Snomed);

      sandbox.assert.notCalled(dbClientStub.getAllRecords);
      expect(result).toEqual([mockDbEntries[0]]);
    });

    it('Should fetch the entries from cache without a db call if cache available by other keys', async () => {
      mockCache.get.withArgs(DbTable.Snomed).returns(mockDbEntries);
      const results = await service.getRecordsByPartitionKey({
        table: DbTable.Snomed,
        partitionKeyValue: mockDbEntries[1].code,
        partitionKeyName: 'code'
      });
      sandbox.assert.calledWith(mockCache.get, DbTable.Snomed);

      sandbox.assert.notCalled(dbClientStub.getAllRecords);
      sandbox.assert.notCalled(mockCache.del);
      expect(results).toEqual([mockDbEntries[1], mockDbEntries[3]]);
    });

    it('Should re-run caching if cache not available while getting the records', async () => {
      mockCache.get.withArgs(DbTable.Snomed).returns(undefined);
      mockCache.get
        .withArgs(DbTable.Snomed)
        .onThirdCall()
        .returns(mockDbEntries);
      const result = await service.getRecordsByPartitionKey({
        table: DbTable.Snomed,
        partitionKeyValue: mockDbEntries[1].id
      });
      sandbox.assert.calledWith(mockCache.set, DbTable.Snomed, mockDbEntries);

      sandbox.assert.calledWith(dbClientStub.getAllRecords, {
        table: DbTable.Snomed
      });
      expect(result).toEqual([mockDbEntries[1]]);
    });

    it('Should update cache if no items were found on the first try and return items', async () => {
      const mockNewEntry = { id: 'id5', code: 'someCode5' };
      mockCache.get
        .withArgs(DbTable.Snomed)
        .onFirstCall()
        .returns(mockDbEntries);
      mockCache.get.withArgs(DbTable.Snomed).onSecondCall().returns(undefined);
      mockCache.get
        .withArgs(DbTable.Snomed)
        .onThirdCall()
        .returns(mockDbEntries.concat([mockNewEntry]));
      const result = await service.getRecordsByPartitionKey({
        table: DbTable.Snomed,
        partitionKeyValue: mockNewEntry.id
      });

      sandbox.assert.calledWith(mockCache.del, DbTable.Snomed);
      sandbox.assert.calledWith(dbClientStub.getAllRecords, {
        table: DbTable.Snomed
      });
      expect(result).toEqual([mockNewEntry]);
    });

    it('Should return an empty list if no items found', async () => {
      mockCache.get.withArgs(DbTable.Snomed).returns(mockDbEntries);
      const result = await service.getRecordsByPartitionKey({
        table: DbTable.Snomed,
        partitionKeyValue: 'not existing key'
      });

      expect(result).toEqual([]);
    });
  });

  describe.each([['getOptionalRecordById'], ['getRecordById']])(
    '%s',
    (testedMethod: string) => {
      it('Should fetch the entry from cache without a db call if cache available by main table key', async () => {
        mockCache.get.withArgs(DbTable.Snomed).returns(mockDbEntries);
        const result = await service[testedMethod]({
          table: DbTable.Snomed,
          partitionKeyValue: mockDbEntries[0].id
        });
        sandbox.assert.calledWith(mockCache.get, DbTable.Snomed);

        sandbox.assert.notCalled(dbClientStub.getAllRecords);
        sandbox.assert.notCalled(mockCache.del);
        expect(result).toEqual(mockDbEntries[0]);
      });

      it('Should re-run caching if cache not available while getting the records', async () => {
        mockCache.get.withArgs(DbTable.Snomed).returns(undefined);
        mockCache.get
          .withArgs(DbTable.Snomed)
          .onThirdCall()
          .returns(mockDbEntries);
        const result = await service[testedMethod]({
          table: DbTable.Snomed,
          partitionKeyValue: mockDbEntries[1].id
        });
        sandbox.assert.calledWith(mockCache.set, DbTable.Snomed, mockDbEntries);

        sandbox.assert.calledWith(dbClientStub.getAllRecords, {
          table: DbTable.Snomed
        });
        expect(result).toEqual(mockDbEntries[1]);
      });

      it('Should update cache if record was not found on the first try and return record', async () => {
        const mockNewEntry = { id: 'id5', code: 'someCode5' };
        mockCache.get
          .withArgs(DbTable.Snomed)
          .onFirstCall()
          .returns(mockDbEntries);
        mockCache.get
          .withArgs(DbTable.Snomed)
          .onSecondCall()
          .returns(undefined);
        mockCache.get
          .withArgs(DbTable.Snomed)
          .onThirdCall()
          .returns(mockDbEntries.concat([mockNewEntry]));
        const result = await service[testedMethod]({
          table: DbTable.Snomed,
          partitionKeyValue: mockNewEntry.id
        });

        sandbox.assert.calledWith(mockCache.del, DbTable.Snomed);
        sandbox.assert.calledWith(dbClientStub.getAllRecords, {
          table: DbTable.Snomed
        });
        expect(result).toEqual(mockNewEntry);
      });
    }
  );

  describe('getOptionalRecordById', () => {
    it('Should return undefined if entry not in cache or db', async () => {
      mockCache.get.withArgs(DbTable.Snomed).returns(mockDbEntries);
      const result = await service.getOptionalRecordById({
        table: DbTable.Snomed,
        partitionKeyValue: 'non existing id'
      });

      sandbox.assert.calledWith(mockCache.get, DbTable.Snomed);
      expect(result).toBeUndefined();
    });
  });

  describe('getRecordById', () => {
    it('Should throw an error if entry not in cache or db', async () => {
      mockCache.get.withArgs(DbTable.Snomed).returns(mockDbEntries);
      await expect(
        service.getRecordById({
          table: DbTable.Snomed,
          partitionKeyValue: 'non existing id'
        })
      ).rejects.toThrow('Empty response - record not found');

      sandbox.assert.calledWith(mockCache.get, DbTable.Snomed);
    });
  });

  describe('getAllRecords', () => {
    it.each([
      [undefined, mockDbEntries],
      [
        { key: 'code', value: mockDbEntries[1].code },
        [mockDbEntries[1], mockDbEntries[3]]
      ],
      [{ key: 'code', value: 'NonExistingCode' }, []]
    ])(
      'Should fetch the data from cache if available with filter: %s',
      async (filterBy: any, expectedEntries: any[]) => {
        mockCache.get.withArgs(DbTable.Snomed).returns(mockDbEntries);
        const results = await service.getAllRecords({
          table: DbTable.Snomed,
          filterBy
        });
        sandbox.assert.calledWith(mockCache.get, DbTable.Snomed);

        sandbox.assert.notCalled(dbClientStub.getAllRecords);
        expect(results).toEqual(expectedEntries);
      }
    );

    it.each([
      [undefined, mockDbEntries],
      [
        { key: 'code', value: mockDbEntries[1].code },
        [mockDbEntries[1], mockDbEntries[3]]
      ],
      [{ key: 'code', value: 'NonExistingCode' }, []]
    ])(
      'Should fetch the data from db to cache when cache empty with filter: %s',
      async (filterBy: any, expectedEntries: any[]) => {
        mockCache.get.withArgs(DbTable.Snomed).returns(undefined);
        mockCache.get
          .withArgs(DbTable.Snomed)
          .onThirdCall()
          .returns(mockDbEntries);

        const results = await service.getAllRecords({
          table: DbTable.Snomed,
          filterBy
        });
        sandbox.assert.calledWith(mockCache.get, DbTable.Snomed);
        sandbox.assert.calledWith(dbClientStub.getAllRecords, {
          table: DbTable.Snomed
        });
        sandbox.assert.calledWith(mockCache.set, DbTable.Snomed, mockDbEntries);
        expect(results).toEqual(expectedEntries);
      }
    );
  });

  describe('createRecord', () => {
    it('Should call through to generic DDB client and clear cache', async () => {
      const callParams: EntityCreateParams = {
        table: DbTable.Snomed,
        item: { some: 'item' },
        conditionExpression: 'mockConditionExpression'
      };
      await service.createRecord(callParams);

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.createRecord,
        callParams
      );
      sandbox.assert.calledOnceWithExactly(
        mockCache.set,
        DbTable.Snomed,
        undefined
      );
    });
  });

  describe('updateRecordProperties', () => {
    it('Should call through to generic DDB client and clear cache', async () => {
      const callParams: EntityUpdateParams = {
        table: DbTable.Snomed,
        partitionKeyValue: 'someKey',
        sortKeyValue: 'someSortKey',
        updates: { mockParam: 'mockValue' }
      };
      await service.updateRecordProperties(callParams);

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.updateRecordProperties,
        callParams
      );
      sandbox.assert.calledOnceWithExactly(
        mockCache.set,
        DbTable.Snomed,
        undefined
      );
    });
  });

  describe('batchUpdate', () => {
    it('Should call through to generic DDB client and clear cache', async () => {
      mockCache.keys.returns([DbTable.Snomed, DbTable.GpOdsCodes, 'testTable']);
      const tableName = 'testTable';
      const inserts: IBatchInput = {
        inserts: [{ some: 'item1' }, { some: 'item2' }]
      };
      await service.batchUpdate(tableName, inserts);

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.batchUpdate,
        tableName,
        inserts
      );
      sandbox.assert.calledThrice(mockCache.set);
      sandbox.assert.calledWith(mockCache.set, DbTable.Snomed, undefined);
      sandbox.assert.calledWith(mockCache.set, DbTable.GpOdsCodes, undefined);
      sandbox.assert.calledWith(mockCache.set, 'testTable', undefined);
    });
  });

  describe('parallelBatchUpdate', () => {
    it('Should call through to generic DDB client, clear entire cache, and return results', async () => {
      mockCache.keys.returns([DbTable.Snomed, DbTable.GpOdsCodes, 'testTable']);
      const tableName = 'testTable';
      const batchInput: IBatchInput = {
        inserts: [{ some: 'item1' }, { some: 'item2' }]
      };
      const mockResult: BatchUpdateResult = {
        totalItems: 2,
        successfulItems: [{ some: 'item1' }, { some: 'item2' }],
        errors: []
      };
      const maxConcurrentBatches = 3;

      dbClientStub.parallelBatchUpdate.resolves(mockResult);

      const result = await service.parallelBatchUpdate(
        tableName,
        batchInput,
        maxConcurrentBatches
      );

      expect(result).toEqual(mockResult);
      sandbox.assert.calledOnceWithExactly(
        dbClientStub.parallelBatchUpdate,
        tableName,
        batchInput,
        maxConcurrentBatches
      );
      sandbox.assert.calledOnce(mockCache.keys);
      sandbox.assert.calledThrice(mockCache.set); // For each key returned by mockCache.keys
      sandbox.assert.calledWith(mockCache.set, DbTable.Snomed, undefined);
      sandbox.assert.calledWith(mockCache.set, DbTable.GpOdsCodes, undefined);
      sandbox.assert.calledWith(mockCache.set, 'testTable', undefined);
    });
  });

  describe('deleteRecord', () => {
    it('Should call through to generic DDB client and clear cache for affected table', async () => {
      const callParams: EntityDeleteParams = {
        table: DbTable.Snomed,
        partitionKeyValue: 'someKey',
        sortKeyValue: 'someSortKey'
      };
      await service.deleteRecord(callParams);

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.deleteRecord,
        callParams
      );
      sandbox.assert.calledOnceWithExactly(
        mockCache.set,
        DbTable.Snomed,
        undefined
      );
    });
  });
});
