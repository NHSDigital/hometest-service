/**
 * Initialize DynamoDB Local tables for local development
 * Run with: npx ts-node scripts/local-dev/init-tables.ts
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
  type CreateTableCommandInput
} from '@aws-sdk/client-dynamodb';

const ENV_NAME = 'local';

const client = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'eu-west-2',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local'
  }
});

interface TableDefinition {
  name: string;
  partitionKey: { name: string; type: 'S' | 'N' };
  sortKey?: { name: string; type: 'S' | 'N' };
  gsis?: Array<{
    indexName: string;
    partitionKey: { name: string; type: 'S' | 'N' };
    sortKey?: { name: string; type: 'S' | 'N' };
  }>;
}

const tables: TableDefinition[] = [
  {
    name: 'nhc-patient-db',
    partitionKey: { name: 'nhsNumber', type: 'S' }
  },
  {
    name: 'nhc-order-db',
    partitionKey: { name: 'id', type: 'S' },
    gsis: [
      {
        indexName: 'healthCheckIdIndex',
        partitionKey: { name: 'healthCheckId', type: 'S' }
      }
    ]
  },
  {
    name: 'nhc-health-check-db',
    partitionKey: { name: 'id', type: 'S' },
    gsis: [
      {
        indexName: 'nhsNumberIndex',
        partitionKey: { name: 'nhsNumber', type: 'S' }
      },
      {
        indexName: 'stepIndex',
        partitionKey: { name: 'step', type: 'S' }
      },
      {
        indexName: 'bloodTestExpiryWritebackStatusStepIndex',
        partitionKey: { name: 'bloodTestExpiryWritebackStatus', type: 'S' },
        sortKey: { name: 'step', type: 'S' }
      },
      {
        indexName: 'expiryStatusStepIndex',
        partitionKey: { name: 'expiryStatus', type: 'S' },
        sortKey: { name: 'step', type: 'S' }
      }
    ]
  },
  {
    name: 'nhc-lab-result-db',
    partitionKey: { name: 'orderId', type: 'S' },
    sortKey: { name: 'testType', type: 'S' },
    gsis: [
      {
        indexName: 'healthCheckIdIndex',
        partitionKey: { name: 'healthCheckId', type: 'S' }
      },
      {
        indexName: 'patientIdIndex',
        partitionKey: { name: 'patientId', type: 'S' }
      }
    ]
  },
  {
    name: 'nhc-audit-event-db',
    partitionKey: { name: 'id', type: 'S' },
    gsis: [
      {
        indexName: 'nhsNumberIndex',
        partitionKey: { name: 'nhsNumber', type: 'S' }
      }
    ]
  },
  {
    name: 'nhc-ods-code-db',
    partitionKey: { name: 'gpOdsCode', type: 'S' }
  },
  {
    name: 'nhc-session-db',
    partitionKey: { name: 'sessionId', type: 'S' }
  },
  {
    name: 'nhc-snomed-db',
    partitionKey: { name: 'id', type: 'S' }
  },
  {
    name: 'nhc-gp-update-scheduler-db',
    partitionKey: { name: 'scheduleId', type: 'S' },
    gsis: [
      {
        indexName: 'healthCheckIdIndex',
        partitionKey: { name: 'healthCheckId', type: 'S' }
      }
    ]
  },
  {
    name: 'nhc-postcode-lsoa-db',
    partitionKey: { name: 'postcode', type: 'S' }
  },
  {
    name: 'nhc-lsoa-imd-db',
    partitionKey: { name: 'lsoaCode', type: 'S' }
  },
  {
    name: 'nhc-dead-letter-messages-db',
    partitionKey: { name: 'id', type: 'S' },
    gsis: [
      {
        indexName: 'queueNameIndex',
        partitionKey: { name: 'queueName', type: 'S' }
      }
    ]
  },
  {
    name: 'nhc-communication-log-db',
    partitionKey: { name: 'messageReference', type: 'S' }
  },
  {
    name: 'nhc-mns-messages-log-db',
    partitionKey: { name: 'id', type: 'S' }
  }
];

function buildCreateTableInput(table: TableDefinition): CreateTableCommandInput {
  const tableName = `${ENV_NAME}-${table.name}`;

  const attributeDefinitions: Array<{ AttributeName: string; AttributeType: 'S' | 'N' }> = [
    { AttributeName: table.partitionKey.name, AttributeType: table.partitionKey.type }
  ];

  if (table.sortKey) {
    attributeDefinitions.push({
      AttributeName: table.sortKey.name,
      AttributeType: table.sortKey.type
    });
  }

  // Add GSI attributes
  if (table.gsis) {
    for (const gsi of table.gsis) {
      if (!attributeDefinitions.find(a => a.AttributeName === gsi.partitionKey.name)) {
        attributeDefinitions.push({
          AttributeName: gsi.partitionKey.name,
          AttributeType: gsi.partitionKey.type
        });
      }
      if (gsi.sortKey && !attributeDefinitions.find(a => a.AttributeName === gsi.sortKey!.name)) {
        attributeDefinitions.push({
          AttributeName: gsi.sortKey.name,
          AttributeType: gsi.sortKey.type
        });
      }
    }
  }

  const input: CreateTableCommandInput = {
    TableName: tableName,
    AttributeDefinitions: attributeDefinitions,
    KeySchema: [
      { AttributeName: table.partitionKey.name, KeyType: 'HASH' },
      ...(table.sortKey ? [{ AttributeName: table.sortKey.name, KeyType: 'RANGE' as const }] : [])
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  if (table.gsis && table.gsis.length > 0) {
    input.GlobalSecondaryIndexes = table.gsis.map(gsi => ({
      IndexName: gsi.indexName,
      KeySchema: [
        { AttributeName: gsi.partitionKey.name, KeyType: 'HASH' as const },
        ...(gsi.sortKey ? [{ AttributeName: gsi.sortKey.name, KeyType: 'RANGE' as const }] : [])
      ],
      Projection: { ProjectionType: 'ALL' as const }
    }));
  }

  return input;
}

async function initializeTables(): Promise<void> {
  console.log('🚀 Initializing DynamoDB Local tables...\n');

  // Check existing tables
  const existingTables = await client.send(new ListTablesCommand({}));
  const existingTableNames = existingTables.TableNames ?? [];

  for (const table of tables) {
    const tableName = `${ENV_NAME}-${table.name}`;

    if (existingTableNames.includes(tableName)) {
      console.log(`⏭️  Table ${tableName} already exists, skipping...`);
      continue;
    }

    try {
      const input = buildCreateTableInput(table);
      await client.send(new CreateTableCommand(input));
      console.log(`✅ Created table: ${tableName}`);
    } catch (error) {
      console.error(`❌ Failed to create table ${tableName}:`, error);
    }
  }

  console.log('\n✨ Table initialization complete!');
  console.log('📊 View tables at: http://localhost:8001');
}

initializeTables().catch(console.error);
