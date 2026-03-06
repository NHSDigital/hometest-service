import { DBClient } from "./db-client";
import { OrderStatusCodes, OrderStatusService } from "./order-status-db";
import { ConsentService } from "./consent-db";

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

  /**
   * Creates or updates a patient record, creates a test order, creates the GENERATED order status,
   * and records consent for the order in a single database transaction.
   *
   * @param nhsNumber - The NHS number of the patient.
   * @param birthDate - The birth date of the patient.
   * @param supplierId - The supplier ID for the test order.
   * @param testCode - The code for the test being ordered.
   * @param correlationId - Correlation ID for tracking the transaction.
   * @param consent - Indicates whether consent is given for the order.
   * @param originator - Optional originator of the order.
   * @returns An object containing orderUid, orderReference, and patientUid.
   * @throws Error if any part of the transaction fails.
   */
  async createPatientOrderAndConsent(
    nhsNumber: string,
    birthDate: string,
    supplierId: string,
    testCode: string,
    correlationId: string,
    consent: boolean,
    originator?: string,
  ): Promise<CreateOrderResult> {
    try {
      return await this.dbClient.withTransaction(async (tx) => {
        // ALPHA: consider refactoring to use a dedicated patient service and order service to encapsulate this logic and make it more testable
        const patientQuery = `
          INSERT INTO patient_mapping (nhs_number, birth_date)
          VALUES ($1, $2)
          ON CONFLICT (nhs_number)
          DO UPDATE SET birth_date = EXCLUDED.birth_date
          RETURNING patient_uid;
        `;

        const patientResult = await tx.query<{ patient_uid: string }, [string, string]>(
          patientQuery,
          [nhsNumber, birthDate],
        );

        if (patientResult.rowCount === 0 || !patientResult.rows[0]) {
          throw new Error("Failed to create or retrieve patient record");
        }

        const patientUid = patientResult.rows[0].patient_uid;

        const orderQuery = `
          INSERT INTO test_order (supplier_id, patient_uid, test_code, originator)
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

        const orderStatusService = new OrderStatusService(tx);
        await orderStatusService.addOrderStatusUpdate({
          orderId: order_uid,
          statusCode: OrderStatusCodes.GENERATED,
          createdAt: new Date().toISOString(),
          correlationId,
        });

        const consentService = new ConsentService(tx);
        await consentService.createConsent(order_uid, consent);

        return {
          orderUid: order_uid,
          orderReference: order_reference,
          patientUid: patientUid,
        };
      });
    } catch (error) {
      throw new Error("Failed to create patient, order and consent in database", {
        cause: error,
      });
    }
  }
}
