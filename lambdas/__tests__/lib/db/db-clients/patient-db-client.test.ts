import { Commons } from '../../../../src/lib/commons';
import { DbClient } from '../../../../src/lib/db/db-client';
import { PatientDbClient } from '../../../../src/lib/db/db-clients/patient-db-client';
import Sinon from 'ts-sinon';
import { DbTable } from '../../../../src/lib/db/db-tables';
import { type IPatient } from '../../../../src/lib/models/patient/patient';

describe('PatientDbClient tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let service: PatientDbClient;
  const serviceClassName = 'PatientDbClient';

  const nhsNumber = '999999999';
  const testPatient: Partial<IPatient> = {
    nhsNumber
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);

    service = new PatientDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('createNewPatient tests', () => {
    test('Verify successful creation of patient', async () => {
      await service.createNewPatient(testPatient);

      sandbox.assert.calledOnceWithExactly(dbClientStub.createRecord, {
        table: DbTable.Patients,
        item: testPatient
      });
    });

    test('Verify unsuccessful creation of patient', async () => {
      const error = new Error('an error occurred');
      dbClientStub.createRecord.throwsException(error);
      await expect(service.createNewPatient(testPatient)).rejects.toThrow(
        error
      );
      sandbox.assert.calledOnceWithExactly(dbClientStub.createRecord, {
        table: DbTable.Patients,
        item: testPatient
      });
    });
  });

  describe('getPatientByNhsNumber tests', () => {
    test('Verify get patient', async () => {
      dbClientStub.getRecordById
        .withArgs({ table: DbTable.Patients, partitionKeyValue: nhsNumber })
        .resolves(testPatient);

      const patient = await service.getPatientByNhsNumber(nhsNumber);

      expect(patient).toEqual(testPatient);
    });

    test('Verify unsuccessful fetching of patient', async () => {
      const error = new Error('an error occurred');
      dbClientStub.getRecordById
        .withArgs({ table: DbTable.Patients, partitionKeyValue: nhsNumber })
        .throwsException(error);
      await expect(service.getPatientByNhsNumber(nhsNumber)).rejects.toThrow(
        error
      );
      sandbox.assert.calledOnceWithExactly(dbClientStub.getRecordById, {
        table: DbTable.Patients,
        partitionKeyValue: nhsNumber
      });
    });
  });

  describe('updatePatient', () => {
    test('Passes correct params to db client', async () => {
      await service.updatePatient(nhsNumber, { gpOdsCode: '123A' });

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.updateRecordProperties,
        {
          table: DbTable.Patients,
          partitionKeyValue: nhsNumber,
          updates: { gpOdsCode: '123A' }
        }
      );
    });
  });
});
