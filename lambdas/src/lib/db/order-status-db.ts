import { DBClient } from "./db-client";
import OrderStatus, { OrderStatusMutator } from "./types/__generated__/hometest/OrderStatus";
import TestOrder from "./types/__generated__/hometest/TestOrder";

export const OrderStatusCodes = {
  GENERATED: "GENERATED",
  QUEUED: "QUEUED",
  SUBMITTED: "SUBMITTED",
  CONFIRMED: "CONFIRMED",
  DISPATCHED: "DISPATCHED",
  RECEIVED: "RECEIVED",
  COMPLETE: "COMPLETE",
} as const;

export type OrderStatusCode = (typeof OrderStatusCodes)[keyof typeof OrderStatusCodes];

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
}

export class OrderStatusService {
  private readonly dbClient: DBClient;

  constructor(dbClient: DBClient) {
    this.dbClient = dbClient;
  }

  /**
   * Retrieve patient ID associated with an order from the database. Returns null if order is not found.
   */
  async getPatientIdFromOrder(
    orderId: TestOrder["order_uid"],
  ): Promise<TestOrder["patient_uid"] | null> {
    const query = `
      SELECT patient_uid
      FROM test_order
      WHERE order_uid = $1::uuid
      LIMIT 1;
    `;

    try {
      const result = await this.dbClient.query<
        { patient_uid: TestOrder["patient_uid"] },
        [TestOrder["order_uid"]]
      >(query, [orderId]);

      return result.rowCount === 0 ? null : result.rows[0].patient_uid;
    } catch (error) {
      throw new Error(`Failed to fetch order from database for orderId ${orderId}`, {
        cause: error,
      });
    }
  }

  /**
   * Check for idempotency - verify if an update with the same correlation ID was already processed
   */
  async checkIdempotency(
    orderId: OrderStatus["order_uid"],
    correlationId: OrderStatus["correlation_id"],
  ): Promise<IdempotencyCheckResult> {
    const query = `
      SELECT 1
      FROM order_status
      WHERE order_uid = $1::uuid AND correlation_id = $2::uuid
      LIMIT 1;
    `;

    try {
      const result = await this.dbClient.query(query, [orderId, correlationId]);

      return {
        isDuplicate: (result.rowCount ?? 0) > 0,
      };
    } catch (error) {
      throw new Error(`Failed to check idempotency for correlationId ${correlationId}`, {
        cause: error,
      });
    }
  }

  // ALPHA: should this method not perform an idempotency check before inserting a new status? Or should that be the responsibility of the caller to check before calling this method?
  /**
   * Add a new order status update to the database
   */
  async addOrderStatusUpdate(params: OrderStatusMutator): Promise<void> {
    const { order_uid, status_code, created_at, correlation_id } = params;

    const query = `
      INSERT INTO order_status (order_uid, status_code, created_at, correlation_id)
      VALUES ($1, $2, $3, $4)
    `;

    try {
      const result = await this.dbClient.query(query, [
        order_uid,
        status_code,
        created_at,
        correlation_id,
      ]);

      if (result.rowCount === 0) {
        throw new Error("Failed to insert order status");
      }
    } catch (error) {
      throw new Error(`Failed to update order status for orderId ${order_uid}`, {
        cause: error,
      });
    }
  }
}
