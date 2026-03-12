import { PostgresDbClient } from "./db-client";
import {
  getPatientIdFromOrder,
  IGetPatientIdFromOrderParams,
  IGetPatientIdFromOrderResult,
} from "../db/queries/getPatientIdFromOrder";
import { checkIdempotency, ICheckIdempotencyParams } from "./queries/checkIdompotency";
import { addOrderStatusUpdate, IAddOrderStatusUpdateParams } from "./queries/addOrderStatusUpdate";

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
  constructor(private readonly dbClient: PostgresDbClient) {}

  /**
   * Retrieve patient ID associated with an order from the database. Returns null if order is not found.
   */
  async getPatientIdFromOrder(
    params: IGetPatientIdFromOrderParams,
  ): Promise<IGetPatientIdFromOrderResult | null> {
    try {
      const result = await getPatientIdFromOrder.run(params, this.dbClient.pgPool);

      return result[0] ?? null;
    } catch (error) {
      throw new Error(`Failed to fetch order for orderId ${params.order_uid}`, { cause: error });
    }
  }

  /**
   * Check for idempotency - verify if an update with the same correlation ID was already processed
   */
  async checkIdempotency(params: ICheckIdempotencyParams): Promise<IdempotencyCheckResult> {
    try {
      const result = await checkIdempotency.run(params, this.dbClient.pgPool);

      return {
        isDuplicate: result.length > 0,
      };
    } catch (error) {
      throw new Error(`Failed to check idempotency for correlationId ${params.correlation_id}`, {
        cause: error,
      });
    }
  }

  // ALPHA: should this method not perform an idempotency check before inserting a new status? Or should that be the responsibility of the caller to check before calling this method?
  /**
   * Add a new order status update to the database
   */
  async addOrderStatusUpdate(params: IAddOrderStatusUpdateParams): Promise<void> {
    try {
      // call PgTyped query
      await addOrderStatusUpdate.run(params, this.dbClient.pgPool);

      // no need to check rowCount
    } catch (error) {
      throw new Error(`Failed to update order status for orderId ${params.order_uid}`, {
        cause: error,
      });
    }
  }
}
