import { Commons } from '../../../../src/lib/commons';
import { DbClient } from '../../../../src/lib/db/db-client';
import Sinon from 'ts-sinon';
import { DbTable } from '../../../../src/lib/db/db-tables';
import { SessionDbClient } from '../../../../src/lib/db/db-clients/session-db-client';
import {
  UserSource,
  type ISession
} from '../../../../src/lib/models/session/session';

describe('SessionDbClient tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let service: SessionDbClient;

  const testSession: ISession = {
    nhsNumber: '12345',
    sessionId: 'sessionId',
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    dateOfBirth: 'dateOfBirth',
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    odsCode: 'gpOdsCode',
    ttl: 1234,
    source: UserSource.NHSApp,
    rumIdentityId: 'identityId'
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);

    service = new SessionDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('createNewSession tests', () => {
    test('Verify successful creation of session', async () => {
      await service.createNewSession(testSession);

      sandbox.assert.calledOnceWithExactly(dbClientStub.createRecord, {
        table: DbTable.Sessions,
        item: testSession
      });
    });

    test('Verify unsuccessful creation of session', async () => {
      const error = new Error('an error occurred');
      dbClientStub.createRecord.throwsException(error);
      await expect(service.createNewSession(testSession)).rejects.toThrow(
        error
      );
    });
  });

  describe('deleteSession tests', () => {
    const TEST_SESSION_ID = 'testSessionId';
    test('Verify successful deletion of session', async () => {
      await service.deleteSession(TEST_SESSION_ID);

      sandbox.assert.calledOnceWithExactly(dbClientStub.deleteRecord, {
        table: DbTable.Sessions,
        partitionKeyValue: TEST_SESSION_ID
      });
    });

    test('Verify unsuccessful deletion of session', async () => {
      const error = new Error('an error occurred');
      dbClientStub.deleteRecord.throwsException(error);
      await expect(service.deleteSession(TEST_SESSION_ID)).rejects.toThrow(
        error
      );
      sandbox.assert.calledOnceWithExactly(dbClientStub.deleteRecord, {
        table: DbTable.Sessions,
        partitionKeyValue: TEST_SESSION_ID
      });
    });
  });

  describe('getSession tests', () => {
    test('Verify get session', async () => {
      dbClientStub.getOptionalRecordById
        .withArgs({
          table: DbTable.Sessions,
          partitionKeyValue: testSession.sessionId
        })
        .resolves(testSession);

      const session = await service.getSession(testSession.sessionId);

      expect(session).toEqual(testSession);
    });

    test('When error occurs then it should be re-thrown', async () => {
      const error = new Error('an error occurred');
      dbClientStub.getOptionalRecordById
        .withArgs({
          table: DbTable.Sessions,
          partitionKeyValue: testSession.sessionId
        })
        .throwsException(error);
      await expect(service.getSession(testSession.sessionId)).rejects.toThrow(
        error
      );
      sandbox.assert.calledOnceWithExactly(dbClientStub.getOptionalRecordById, {
        table: DbTable.Sessions,
        partitionKeyValue: testSession.sessionId
      });
    });

    test('When no session in DB then undefined is returned', async () => {
      dbClientStub.getOptionalRecordById.resolves(undefined);

      const session = await service.getSession(testSession.sessionId);

      expect(session).toEqual(undefined);
    });
  });
});
