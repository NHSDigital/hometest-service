import { type DbClient } from '../db-client';
import { DbTable } from '../db-tables';
import { type EntityCreateParams } from '../entity-update-params';
import { type IAuditEvent } from '../../models/events/audit-event';
import { Service } from '../../service';
import { type Commons } from '../../commons';

export class EventsDbClient extends Service {
  readonly dbClient: DbClient;
  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'EventsDbClient');
    this.dbClient = dbClient;
  }

  async insertAuditEvent(auditEvent: Partial<IAuditEvent>): Promise<void> {
    const createParams: EntityCreateParams = {
      table: DbTable.AuditEvents,
      item: auditEvent
    };
    await this.dbClient.createRecord(createParams);
  }
}
