import { DBClient } from "./db-client";

<<<<<<< HEAD
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

=======
>>>>>>> 84f1dcc (feat: add initial implementation)
export interface OrderStatusRow {
  status_id: string;
  order_uid: string;
  order_reference: number;
<<<<<<< HEAD
  status_code: OrderStatusCode;
  created_at: string;
=======
  status_code: string;
  created_at: string;
  business_status?: string;
>>>>>>> 84f1dcc (feat: add initial implementation)
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
<<<<<<< HEAD
  orderReference?: number;
  statusCode: OrderStatusCode;
=======
  statusCode: string;
  businessStatus?: string;
>>>>>>> 84f1dcc (feat: add initial implementation)
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
<<<<<<< HEAD
      SELECT patient_uid
=======
      SELECT order_uid, patient_uid, order_reference, supplier_id, test_code, created_at
>>>>>>> 84f1dcc (feat: add initial implementation)
      FROM hometest.test_order
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
<<<<<<< HEAD
   * Check for idempotency - verify if an update with the same correlation ID was already processed
   */
  async checkIdempotency(
    orderId: string,
    correlationId: string,
  ): Promise<IdempotencyCheckResult> {
    const query = `
      SELECT 1
      FROM hometest.order_status
      WHERE order_uid = $1 AND correlation_id = $2
=======
   * Get the latest status update for an order
   */
  async getLatestOrderStatus(orderId: string): Promise<OrderStatusRow | null> {
    const query = `
      SELECT status_id, order_uid, order_reference, status_code, created_at, business_status
      FROM hometest.order_status
      WHERE order_uid = $1
      ORDER BY created_at DESC
>>>>>>> 84f1dcc (feat: add initial implementation)
      LIMIT 1;
    `;

    try {
<<<<<<< HEAD
      const result = await this.dbClient.query(query, [orderId, correlationId]);

      return {
        isDuplicate: (result.rowCount ?? 0) > 0,
=======
      const result = await this.dbClient.query<OrderStatusRow, [string]>(
        query,
        [orderId],
      );

      return result.rowCount === 0 ? null : result.rows[0];
    } catch (error) {
      throw new Error(
        `Failed to fetch latest order status for orderId ${orderId}`,
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
    correlationId?: string,
  ): Promise<IdempotencyCheckResult> {
    // Treat empty or missing correlation ID as invalid for idempotency
    if (!correlationId) {
      // No correlation ID → cannot be a duplicate
      return { isDuplicate: false };
    }

    const query = `
    SELECT status_id, order_uid, order_reference, status_code, created_at, correlation_id
    FROM hometest.order_status
    WHERE order_uid = $1 AND correlation_id = $2
    LIMIT 1;
  `;

    try {
      const result = await this.dbClient.query<
        OrderStatusRow,
        [string, string]
      >(query, [orderId, correlationId]);

      if (result.rowCount === 0) {
        return { isDuplicate: false };
      }

      return {
        isDuplicate: true,
        lastUpdate: result.rows[0],
>>>>>>> 84f1dcc (feat: add initial implementation)
      };
    } catch (error) {
      throw new Error(
        `Failed to check idempotency for correlationId ${correlationId}`,
        { cause: error },
      );
    }
  }

  /**
<<<<<<< HEAD
=======
   * Validate business status against allowed domain-specific statuses
   */
  isValidBusinessStatus(businessStatus?: string): boolean {
    // Allowed business statuses from the AC3 requirement
    const ALLOWED_BUSINESS_STATUSES = ["DISPATCHED", "RECEIVED"];

    if (!businessStatus) {
      return true; // Business status is optional
    }

    return ALLOWED_BUSINESS_STATUSES.includes(businessStatus);
  }

  /**
>>>>>>> 84f1dcc (feat: add initial implementation)
   * Update order status in the database
   */
  async updateOrderStatus(
    params: OrderStatusUpdateParams,
  ): Promise<OrderStatusRow> {
<<<<<<< HEAD
    const { orderId, orderReference, statusCode, createdAt, correlationId } =
      params;

    const query = `
      INSERT INTO hometest.order_status (order_uid, order_reference, status_code, created_at, correlation_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING status_id, order_uid, order_reference, status_code, created_at, correlation_id;
=======
    const { orderId, statusCode, businessStatus, createdAt, correlationId } =
      params;

    const query = `
      INSERT INTO hometest.order_status (order_uid, status_code, created_at, business_status, correlation_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING status_id, order_uid, order_reference, status_code, created_at, business_status;
>>>>>>> 84f1dcc (feat: add initial implementation)
    `;

    try {
      const result = await this.dbClient.query<
        OrderStatusRow,
<<<<<<< HEAD
        [string, number | null, string, string, string | null]
      >(query, [
        orderId,
        orderReference ?? null,
        statusCode,
        createdAt,
=======
        [string, string, string, string | null, string]
      >(query, [
        orderId,
        statusCode,
        createdAt,
        businessStatus || null,
>>>>>>> 84f1dcc (feat: add initial implementation)
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
<<<<<<< HEAD
=======

  /**
   * Extract UUID from a FHIR reference (e.g., "ServiceRequest/550e8400-e29b-41d4-a716-446655440000")
   */
  extractIdFromReference(reference: string): string | null {
    const parts = reference.split("/");

    return parts.length === 2 ? parts[1] : null;
  }
>>>>>>> 84f1dcc (feat: add initial implementation)
}
