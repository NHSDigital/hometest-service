/**
 * Seed DynamoDB Local with test data for local development
 * Run with: npx ts-node scripts/local-dev/seed-data.ts
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const ENV_NAME = 'local';

const client = DynamoDBDocument.from(
  new DynamoDBClient({
    endpoint: 'http://localhost:8000',
    region: 'eu-west-2',
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local'
    }
  })
);

async function seedData(): Promise<void> {
  console.log('🌱 Seeding DynamoDB Local with test data...\n');

  // Seed GP ODS Codes
  const gpOdsCodes = [
    { gpOdsCode: 'A12345', enabled: true, name: 'Test GP Surgery' },
    { gpOdsCode: 'B67890', enabled: true, name: 'Demo Medical Centre' },
    { gpOdsCode: 'C11111', enabled: false, name: 'Disabled Practice' }
  ];

  for (const gp of gpOdsCodes) {
    await client.send(new PutCommand({
      TableName: `${ENV_NAME}-nhc-ods-code-db`,
      Item: gp
    }));
    console.log(`✅ Added GP ODS Code: ${gp.gpOdsCode}`);
  }

  // Seed test patient
  const testPatient = {
    nhsNumber: '9999999999',
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: '1990-01-01',
    email: 'test.user@example.com',
    phoneNumber: '+447123456789',
    address: {
      line1: '123 Test Street',
      city: 'London',
      postcode: 'SW1A 1AA'
    },
    gpOdsCode: 'A12345',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await client.send(new PutCommand({
    TableName: `${ENV_NAME}-nhc-patient-db`,
    Item: testPatient
  }));
  console.log(`✅ Added test patient: ${testPatient.nhsNumber}`);

  // Seed postcode to LSOA mappings
  const postcodeMappings = [
    { postcode: 'SW1A1AA', lsoaCode: 'E01004736' },
    { postcode: 'E11AA', lsoaCode: 'E01000001' },
    { postcode: 'M11AA', lsoaCode: 'E01005000' }
  ];

  for (const mapping of postcodeMappings) {
    await client.send(new PutCommand({
      TableName: `${ENV_NAME}-nhc-postcode-lsoa-db`,
      Item: mapping
    }));
    console.log(`✅ Added postcode mapping: ${mapping.postcode}`);
  }

  // Seed LSOA to IMD mappings
  const lsoaMappings = [
    { lsoaCode: 'E01004736', imdDecile: 5, imdRank: 15000 },
    { lsoaCode: 'E01000001', imdDecile: 3, imdRank: 8000 },
    { lsoaCode: 'E01005000', imdDecile: 7, imdRank: 22000 }
  ];

  for (const mapping of lsoaMappings) {
    await client.send(new PutCommand({
      TableName: `${ENV_NAME}-nhc-lsoa-imd-db`,
      Item: mapping
    }));
    console.log(`✅ Added LSOA mapping: ${mapping.lsoaCode}`);
  }

  // Seed some SNOMED codes for testing
  const snomedCodes = [
    { id: '271649006', description: 'Systolic blood pressure' },
    { id: '271650006', description: 'Diastolic blood pressure' },
    { id: '27113001', description: 'Body weight' },
    { id: '50373000', description: 'Body height' },
    { id: '60621009', description: 'Body mass index' }
  ];

  for (const snomed of snomedCodes) {
    await client.send(new PutCommand({
      TableName: `${ENV_NAME}-nhc-snomed-db`,
      Item: snomed
    }));
    console.log(`✅ Added SNOMED code: ${snomed.id}`);
  }

  console.log('\n✨ Data seeding complete!');
  console.log('📊 View data at: http://localhost:8001');
}

seedData().catch(console.error);
