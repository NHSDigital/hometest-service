import { DBClient } from "./db-client";

export interface TransactionServiceProperties {
  dbClient: DBClient;
}

export interface CreateOrderResult {
  orderUid: string;
  orderReference: number;
  patientUid: string;
}

export class TransactionService {
  private readonly dbClient: DBClient;
  constructor({ dbClient }: TransactionServiceProperties) {
    this.dbClient = dbClient;
  }

  async createPatientAndOrderAndStatus(
    nhsNumber: string,
    birthDate: string,
    supplierId: string,
    testCode: string,
    originator?: string,
  ): Promise<CreateOrderResult> {
    try {
      return await this.dbClient.withTransaction(async (tx) => {
        const patientQuery = `
          INSERT INTO hometest.patient_mapping (nhs_number, birth_date)
          VALUES ($1, $2)
          ON CONFLICT (nhs_number)
          DO UPDATE SET birth_date = EXCLUDED.birth_date
          RETURNING patient_uid;
        `;

        const patientResult = await tx.query<
          { patient_uid: string },
          [string, string]
        >(patientQuery, [nhsNumber, birthDate]);

        if (patientResult.rowCount === 0 || !patientResult.rows[0]) {
          throw new Error("Failed to create or retrieve patient record");
        }

        const patientUid = patientResult.rows[0].patient_uid;

        const orderQuery = `
          INSERT INTO hometest.test_order (supplier_id, patient_uid, test_code, originator)
          VALUES ($1, $2, $3, $4)
          RETURNING order_uid, order_reference;
        `;

        const orderResult = await tx.query<
          { order_uid: string; order_reference: number },
          [string, string, string, string | undefined]
        >(orderQuery, [supplierId, patientUid, testCode, originator]);

        if (orderResult.rowCount === 0 || !orderResult.rows[0]) {
          throw new Error("Failed to create test order");
        }

        const { order_uid, order_reference } = orderResult.rows[0];

        const orderStatusQuery = `
          INSERT INTO hometest.order_status (order_uid, order_reference, status_code)
          VALUES ($1, $2, $3)
          RETURNING status_id;
        `;

        const statusResult = await tx.query<
          { status_id: string },
          [string, number, string]
        >(orderStatusQuery, [order_uid, order_reference, "GENERATED"]);

        if (statusResult.rowCount === 0 || !statusResult.rows[0]) {
          throw new Error("Failed to create order status");
        }

        return {
          orderUid: order_uid,
          orderReference: order_reference,
          patientUid: patientUid,
        };
      });
    } catch (error) {
      throw new Error("Failed to create patient and order in database", {
        cause: error,
      });
    }
  }
}
