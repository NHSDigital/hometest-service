enum DbTable {
  Patients = 'Patients',
  HealthChecks = 'HealthCheck',
  LabOrders = 'LabOrders',
  LabResults = 'LabResults',
  AuditEvents = 'AuditEvents',
  GpOdsCodes = 'GpOdsCodes',
  Sessions = 'Sessions',
  Snomed = 'Snomed',
  GpUpdateScheduler = 'GpUpdateScheduler',
  DeadLetterMessages = 'DeadLetterMessages',
  TownsendScores = 'TownsendScores',
  PostcodeLsoa = 'PostcodeLsoa',
  LsoaImd = 'LsoaImd',
  CommunicationLog = 'CommunicationLog',
  MnsMessagesLog = 'MnsMessagesLog'
}

interface DbTableDetails {
  partitionKeyName: string;
  sortKeyName?: string;
  tableName: string;
}

const DbTableDetailsMap = new Map<DbTable, DbTableDetails>([
  [
    DbTable.Patients,
    {
      partitionKeyName: 'nhsNumber',
      tableName: `${process.env.ENV_NAME}-nhc-patient-db`
    }
  ],
  [
    DbTable.HealthChecks,
    {
      partitionKeyName: 'id',
      tableName: `${process.env.ENV_NAME}-nhc-health-check-db`
    }
  ],
  [
    DbTable.LabOrders,
    {
      partitionKeyName: 'id',
      tableName: `${process.env.ENV_NAME}-nhc-order-db`
    }
  ],
  [
    DbTable.LabResults,
    {
      partitionKeyName: 'orderId',
      sortKeyName: 'testType',
      tableName: `${process.env.ENV_NAME}-nhc-lab-result-db`
    }
  ],
  [
    DbTable.AuditEvents,
    {
      partitionKeyName: 'id',
      tableName: `${process.env.ENV_NAME}-nhc-audit-event-db`
    }
  ],
  [
    DbTable.GpOdsCodes,
    {
      partitionKeyName: 'gpOdsCode',
      tableName: `${process.env.ENV_NAME}-nhc-ods-code-db`
    }
  ],
  [
    DbTable.Sessions,
    {
      partitionKeyName: 'sessionId',
      tableName: `${process.env.ENV_NAME}-nhc-session-db`
    }
  ],
  [
    DbTable.Snomed,
    {
      partitionKeyName: 'id',
      tableName: `${process.env.ENV_NAME}-nhc-snomed-db`
    }
  ],
  [
    DbTable.GpUpdateScheduler,
    {
      partitionKeyName: 'scheduleId',
      tableName: `${process.env.ENV_NAME}-nhc-gp-update-scheduler-db`
    }
  ],
  [
    DbTable.DeadLetterMessages,
    {
      partitionKeyName: 'id',
      tableName: `${process.env.ENV_NAME}-nhc-dead-letter-messages-db`
    }
  ],
  [
    DbTable.TownsendScores,
    {
      partitionKeyName: 'postcode',
      tableName:
        process.env.TOWNSEND_TABLE_NAME ??
        `${process.env.ENV_NAME}-nhc-townsend-dev-db`
    }
  ],
  [
    DbTable.PostcodeLsoa,
    {
      partitionKeyName: 'postcode',
      tableName: `${process.env.ENV_NAME}-nhc-postcode-lsoa-db`
    }
  ],
  [
    DbTable.LsoaImd,
    {
      partitionKeyName: 'lsoaCode',
      tableName: `${process.env.ENV_NAME}-nhc-lsoa-imd-db`
    }
  ],
  [
    DbTable.CommunicationLog,
    {
      partitionKeyName: 'messageReference',
      tableName: `${process.env.ENV_NAME}-nhc-communication-log-db`
    }
  ],
  [
    DbTable.MnsMessagesLog,
    {
      partitionKeyName: 'id',
      tableName: `${process.env.ENV_NAME}-nhc-mns-messages-log-db`
    }
  ]
]);

export { DbTable, DbTableDetailsMap, type DbTableDetails };
