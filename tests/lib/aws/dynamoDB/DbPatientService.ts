import { TermsAndConditionsLatestVersion } from '../../../testData/patientTestData';
import { DynamoDBService } from './DynamoDBService';
import { v4 as uuidv4 } from 'uuid';

export interface PatientItem {
  nhsNumber: string;
  acceptedTermsVersion?: string;
  dateOfBirth?: string;
  gpOdsCode?: string;
  nhsLoginId?: string;
  patientId?: string;
}

export default class DbPatientService extends DynamoDBService {
  private getTableName(): string {
    return `${this.envName}-nhc-patient-db`;
  }

  async deletePatientItemByNhsNumber(nhsNumber: string): Promise<void> {
    await this.deleteItemByPartitionKey(
      this.getTableName(),
      'nhsNumber',
      nhsNumber
    );
  }

  async getPatientItemByNhsNumber(nhsNumber: string): Promise<PatientItem> {
    return (await this.getJsonItemByPartitionKey(
      this.getTableName(),
      'nhsNumber',
      nhsNumber
    )) as PatientItem;
  }

  async getPatientIdByNhsNumber(nhsNumber: string): Promise<string> {
    const patientItem = await this.getPatientItemByNhsNumber(nhsNumber);

    if (patientItem?.patientId) {
      return patientItem?.patientId;
    }

    throw Error('Patient doesnt exist');
  }

  async createPatient(patient: PatientItem): Promise<void> {
    await this.putItem(this.getTableName(), patient);
    console.log('Patient db item created');
  }

  async updatePatientId(
    nhsNumber: string,
    patientId: string = uuidv4()
  ): Promise<void> {
    const response = await this.updateItemByPartitionKey(
      this.getTableName(),
      'nhsNumber',
      nhsNumber,
      'patientId',
      patientId,
      'S',
      'S'
    );
    console.log(`Updated value for patient with a NHS number'${nhsNumber}'`, {
      response
    });
  }

  async updatePatientAcceptedTermsVersion(
    nhsNumber: string,
    acceptedTermsVersion: string = TermsAndConditionsLatestVersion
  ): Promise<void> {
    const response = await this.updateItemByPartitionKey(
      this.getTableName(),
      'nhsNumber',
      nhsNumber,
      'acceptedTermsVersion',
      acceptedTermsVersion,
      'S',
      'S'
    );
    console.log(`Updated value for patient with a NHS number'${nhsNumber}'`, {
      response
    });
  }

  async updatePatientOdsCode(
    nhsNumber: string,
    odsCode: string
  ): Promise<void> {
    const response = await this.updateItemByPartitionKey(
      this.getTableName(),
      'nhsNumber',
      nhsNumber,
      'gpOdsCode',
      odsCode,
      'S',
      'S'
    );
    console.log(`Updated value for patient with a NHS number '${nhsNumber}'`, {
      response
    });
  }
}
