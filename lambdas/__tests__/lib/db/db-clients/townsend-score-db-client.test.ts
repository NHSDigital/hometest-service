import { Commons } from '../../../../src/lib/commons';
import { DbClient } from '../../../../src/lib/db/db-client';
import Sinon from 'ts-sinon';
import { DbTable } from '../../../../src/lib/db/db-tables';
import { TownsendScoreDbClient } from '../../../../src/lib/db/db-clients/townsend-score-db-client';
import { type ITownsendScore } from '../../../../src/lib/models/townsend-scores/townsend-score';

describe('TownsendScoreDbClient tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let service: TownsendScoreDbClient;
  const serviceClassName = 'TownsendScoreDbClient';

  const postcode = 'M17 5RN';
  const postcodeNoSpaces = 'M175RN';
  const townsendScoreDbRecord: ITownsendScore = {
    postcode: postcodeNoSpaces,
    deprivationScore: '3'
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);

    service = new TownsendScoreDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('getDeprivationScoreByPostcode tests', () => {
    test('Should return deprivationScore', async () => {
      dbClientStub.getOptionalRecordById
        .withArgs({
          table: DbTable.TownsendScores,
          partitionKeyValue: postcodeNoSpaces
        })
        .resolves(townsendScoreDbRecord);

      const deprivationScore =
        await service.getDeprivationScoreByPostcode(postcode);

      sandbox.assert.calledTwice(commonsStub.logInfo);

      sandbox.assert.calledWith(
        commonsStub.logInfo.firstCall,
        serviceClassName,
        'About to fetch townsend deprivation score by postcode'
      );

      sandbox.assert.calledWith(
        commonsStub.logInfo.secondCall,
        serviceClassName,
        'Townsend deprivation score has been fetched successfully'
      );

      expect(deprivationScore).toEqual(townsendScoreDbRecord.deprivationScore);
    });

    test('Should return townsend deprivation score = null when record is not present in database', async () => {
      const townsendScore =
        await service.getDeprivationScoreByPostcode(postcode);

      sandbox.assert.calledOnceWithExactly(dbClientStub.getOptionalRecordById, {
        table: DbTable.TownsendScores,
        partitionKeyValue: postcodeNoSpaces
      });

      sandbox.assert.calledWith(
        commonsStub.logInfo.firstCall,
        serviceClassName,
        'About to fetch townsend deprivation score by postcode'
      );

      sandbox.assert.calledWith(
        commonsStub.logInfo.secondCall,
        serviceClassName,
        'Postcode could not be found in table',
        {
          postcode: postcodeNoSpaces
        }
      );

      expect(townsendScore).toEqual(null);
    });
  });
});
