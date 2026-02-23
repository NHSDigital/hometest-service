import { DBClient } from "./db-client";

export const OrderStatusCodes = {
  GENERATED: "GENERATED",
  QUEUED: "QUEUED",
  PLACED: "PLACED",
  ORDER_RECEIVED: "ORDER_RECEIVED",
  DISPATCHED: "DISPATCHED",
  RECEIVED: "RECEIVED",
  COMPLETE: "COMPLETE",
} as const;

export type OrderStatusCode =
  (typeof OrderStatusCodes)[keyof typeof OrderStatusCodes];

export interface OrderStatusRow {
  status_id: string;
  order_uid: string;
  order_reference: number;
  status_code: OrderStatusCode;
  created_at: string;
  correlation_id: string;
}

export interface OrderRow {
  order_uid: string;
  patient_uid: string;
  order_reference: number;
  supplier_id: string;
  test_code: string;
  created_at: string;
}

export interface OrderStatusUpdateParams {
  orderId: string;
  orderReference?: number;
  statusCode: OrderStatusCode;
  createdAt: string;
  correlationId: string;
}

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  lastUpdate?: OrderStatusRow;
}

export class OrderStatusService {
  private readonly dbClient: DBClient;

  constructor(dbClient: DBClient) {
    this.dbClient = dbClient;
  }

  /**
   * Verify that an order exists and retrieve its details
   */
  async getOrder(orderId: string): Promise<OrderRow | null> {
    const query = `
      SELECT patient_uid
      FROM test_order
      WHERE order_uid = $1
      LIMIT 1;
    `;

    try {
      const result = await this.dbClient.query<OrderRow, [string]>(query, [
        orderId,
      ]);

      return result.rowCount === 0 ? null : result.rows[0];
    } catch (error) {
      throw new Error(
        `Failed to fetch order from database for orderId ${orderId}`,
        {
          cause: error,
        },
      );
    }
  }

  /**
   * Check for idempotency - verify if an update with the same correlation ID was already processed
   */
  async checkIdempotency(
    orderId: string,
    correlationId: string,
  ): Promise<IdempotencyCheckResult> {
    const query = `
      SELECT 1
      FROM order_status
      WHERE order_uid = $1 AND correlation_id = $2
      LIMIT 1;
    `;

    try {
      const result = await this.dbClient.query(query, [orderId, correlationId]);

      return {
        isDuplicate: (result.rowCount ?? 0) > 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to check idempotency for correlationId ${correlationId}`,
        { cause: error },
      );
    }
  }

  /**
   * Update order status in the database
   */
  async updateOrderStatus(
    params: OrderStatusUpdateParams,
  ): Promise<OrderStatusRow> {
    const { orderId, orderReference, statusCode, createdAt, correlationId } =
      params;

    const query = `
      INSERT INTO order_status (order_uid, order_reference, status_code, created_at, correlation_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING status_id, order_uid, order_reference, status_code, created_at, correlation_id;
    `;

    try {
      const result = await this.dbClient.query<
        OrderStatusRow,
        [string, number | null, string, string, string | null]
      >(query, [
        orderId,
        orderReference ?? null,
        statusCode,
        createdAt,
        correlationId,
      ]);

      if (result.rowCount === 0) {
        throw new Error("Failed to insert order status");
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update order status for orderId ${orderId}`, {
        cause: error,
      });
    }
  }
}
