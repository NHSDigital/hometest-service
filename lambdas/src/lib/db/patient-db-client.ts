import { type NotifyRecipient } from "../types/notify-message";
import { type DBClient } from "./db-client";

export class PatientDbClient {
  constructor(private readonly dbClient: DBClient) {}

  async getNotifyRecipientData(patientId: string): Promise<NotifyRecipient> {
    const query = `
      SELECT nhs_number, birth_date
      FROM patient_mapping
      WHERE patient_uid = $1::uuid
      LIMIT 1;
    `;

    try {
      const result = await this.dbClient.query<
        { nhs_number: string; birth_date: string | Date },
        [string]
      >(query, [patientId]);

      if (result.rowCount === 0 || !result.rows[0]) {
        throw new Error(`Notify recipient not found for patientId ${patientId}`);
      }

      const row = result.rows[0];

      return {
        nhsNumber: row.nhs_number,
        dateOfBirth:
          row.birth_date instanceof Date
            ? row.birth_date.toISOString().slice(0, 10)
            : row.birth_date,
      };
    } catch (error) {
      throw new Error(`Failed to fetch notify recipient data for patientId ${patientId}`, {
        cause: error,
      });
    }
  }
}
