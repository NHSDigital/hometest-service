import { type DBClient } from "./db-client";

export interface Patient {
  nhsNumber: string;
  birthDate: string;
}

export class PatientDbClient {
  constructor(private readonly dbClient: DBClient) {}

  async get(patientId: string): Promise<Patient> {
    const query = `
      SELECT nhs_number, birth_date
      FROM patient_mapping
      WHERE patient_uid = $1::uuid
      LIMIT 1;
    `;

    try {
      const result = await this.dbClient.query<
        { nhs_number: string; birth_date: string },
        [string]
      >(query, [patientId]);

      if (result.rowCount === 0 || !result.rows[0]) {
        throw new Error(`Notify recipient not found for patientId ${patientId}`);
      }

      const row = result.rows[0];

      return {
        nhsNumber: row.nhs_number,
        birthDate: row.birth_date,
      };
    } catch (error) {
      throw new Error(`Failed to fetch notify recipient data for patientId ${patientId}`, {
        cause: error,
      });
    }
  }
}
