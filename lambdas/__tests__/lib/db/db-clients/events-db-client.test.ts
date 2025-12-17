import { Commons } from '../../../../src/lib/commons';
import { DbClient } from '../../../../src/lib/db/db-client';
import { EventsDbClient } from '../../../../src/lib/db/db-clients/events-db-client';
import Sinon from 'ts-sinon';
import { DbTable } from '../../../../src/lib/db/db-tables';
import { type IAuditEvent } from '../../../../src/lib/models/events/audit-event';
import { AuditEventType } from '@dnhc-health-checks/shared';

describe('EventsDbClient tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let service: EventsDbClient;

  const testAuditEvent: Partial<IAuditEvent> = {
    id: 'eb69f9f3-f994-4852-a924-1dd182e03cec',
    healthCheckId: '12345',
    nhcVersion: '1.0',
    eventType: AuditEventType.HealthCheckCreated
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);

    service = new EventsDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('insertAuditEvent tests', () => {
    test('should call create record with expected params', async () => {
      await service.insertAuditEvent(testAuditEvent);

      expect(
        dbClientStub.createRecord.calledOnceWithExactly({
          table: DbTable.AuditEvents,
          item: testAuditEvent
        })
      ).toBeTruthy();
    });

    test('when create record fails then the error should be rethrown', async () => {
      const exception = new Error('an error occurred');
      dbClientStub.createRecord.throwsException(exception);

      await expect(service.insertAuditEvent(testAuditEvent)).rejects.toThrow(
        exception
      );
      expect(
        dbClientStub.createRecord.calledOnceWithExactly({
          table: DbTable.AuditEvents,
          item: testAuditEvent
        })
      ).toBeTruthy();
    });
  });
});
