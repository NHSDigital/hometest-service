import { type IPatient } from '../../models/patient/patient';
import { Service } from '../../service';
import { type DbClient } from '../db-client';
import { DbTable } from '../db-tables';
import {
  type EntityFetchParams,
  type EntityCreateParams,
  type EntityUpdateParams
} from '../entity-update-params';
import { type Commons } from '../../commons';

export class PatientDbClient extends Service {
  readonly dbClient: DbClient;
  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'PatientDbClient');
    this.dbClient = dbClient;
  }

  public async createNewPatient(patient: Partial<IPatient>): Promise<void> {
    this.logger.debug('about to create a new patient', {
      patientId: patient.patientId
    });

    const createParams: EntityCreateParams = {
      table: DbTable.Patients,
      item: patient
    };

    await this.dbClient.createRecord(createParams);
  }

  public async getPatientByNhsNumber(nhsNumber: string): Promise<IPatient> {
    const fetchParams: EntityFetchParams = {
      table: DbTable.Patients,
      partitionKeyValue: nhsNumber
    };

    return await this.dbClient.getRecordById<IPatient>(fetchParams);
  }

  public async updatePatientInfo(
    nhsNumber: string,
    acceptedTermsVersion: string | null
  ): Promise<void> {
    this.logger.debug('about to update patient info', {
      acceptedTermsVersion
    });

    const updateParams: EntityUpdateParams = {
      table: DbTable.Patients,
      partitionKeyValue: nhsNumber,
      updates: {
        acceptedTermsVersion
      }
    };

    await this.dbClient.updateRecordProperties(updateParams);
  }

  public async updatePatient(
    nhsNumber: string,
    patient: Partial<IPatient>
  ): Promise<void> {
    const updateParams: EntityUpdateParams = {
      table: DbTable.Patients,
      partitionKeyValue: nhsNumber,
      updates: {
        ...patient
      }
    };

    await this.dbClient.updateRecordProperties(updateParams);
  }
}
