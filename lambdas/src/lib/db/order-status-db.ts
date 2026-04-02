import { DBClient } from "./db-client";

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

export interface OrderRow {
  order_uid: string;
  patient_uid: string;
  order_reference: number;
  supplier_id: string;
  test_code: string;
  created_at: string;
  originator?: string;
}

export interface OrderStatusUpdateParams {
  orderId: string;
  statusCode: OrderStatusCode;
  createdAt: string;
  correlationId: string;
}

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
}

export interface NotifyRecipientData {
  nhsNumber: string;
  dateOfBirth: string;
}

export interface NotificationAuditEntryParams {
  messageReference: string;
  eventCode: string;
  correlationId: string;
  status: string;
  notifyMessageId?: string | null;
  routingPlanId?: string | null;
}

export class OrderStatusService {
  private readonly dbClient: DBClient;

  constructor(dbClient: DBClient) {
    this.dbClient = dbClient;
  }

  /**
   * Retrieve patient ID associated with an order from the database. Returns null if order is not found.
   */
  async getPatientIdFromOrder(orderId: string): Promise<string | null> {
    const query = `
      SELECT patient_uid
      FROM test_order
      WHERE order_uid = $1::uuid
      LIMIT 1;
    `;

    try {
      const result = await this.dbClient.query<{ patient_uid: string }, [string]>(query, [orderId]);

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
  async checkIdempotency(orderId: string, correlationId: string): Promise<IdempotencyCheckResult> {
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
  async addOrderStatusUpdate(params: OrderStatusUpdateParams): Promise<void> {
    const { orderId, statusCode, createdAt, correlationId } = params;

    const query = `
      INSERT INTO order_status (order_uid, status_code, created_at, correlation_id)
      VALUES ($1, $2, $3, $4)
    `;

    try {
      const result = await this.dbClient.query(query, [
        orderId,
        statusCode,
        createdAt,
        correlationId,
      ]);

      if (result.rowCount === 0) {
        throw new Error("Failed to insert order status");
      }
    } catch (error) {
      throw new Error(`Failed to update order status for orderId ${orderId}`, {
        cause: error,
      });
    }
  }

  async getNotifyRecipientData(patientId: string): Promise<NotifyRecipientData> {
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

  async isFirstStatusOccurrence(orderId: string, statusCode: OrderStatusCode): Promise<boolean> {
    const query = `
      SELECT COUNT(*)::int AS count
      FROM order_status
      WHERE order_uid = $1::uuid AND status_code = $2;
    `;

    try {
      const result = await this.dbClient.query<{ count: number }, [string, OrderStatusCode]>(
        query,
        [orderId, statusCode],
      );

      return result.rows[0]?.count === 1;
    } catch (error) {
      throw new Error(
        `Failed to verify first occurrence for orderId ${orderId} and statusCode ${statusCode}`,
        {
          cause: error,
        },
      );
    }
  }

  async insertNotificationAuditEntry(params: NotificationAuditEntryParams): Promise<void> {
    const {
      messageReference,
      notifyMessageId = null,
      eventCode,
      routingPlanId = null,
      correlationId,
      status,
    } = params;

    const query = `
      INSERT INTO notification_audit (
        message_reference,
        notify_message_id,
        event_code,
        routing_plan_id,
        correlation_id,
        status
      )
      VALUES ($1::uuid, $2, $3, $4::uuid, $5::uuid, $6)
    `;

    try {
      const result = await this.dbClient.query(query, [
        messageReference,
        notifyMessageId,
        eventCode,
        routingPlanId,
        correlationId,
        status,
      ]);

      if (result.rowCount === 0) {
        throw new Error("Failed to insert notification audit entry");
      }
    } catch (error) {
      throw new Error(
        `Failed to insert notification audit entry for messageReference ${messageReference}`,
        {
          cause: error,
        },
      );
    }
  }
}
