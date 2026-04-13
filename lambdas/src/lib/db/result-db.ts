import { ResultStatus } from "../types/status";
import { DBClient } from "./db-client";

export class ResultService {
  private readonly dbClient: DBClient;
  constructor(dbClient: DBClient) {
    this.dbClient = dbClient;
  }

  async updateResultStatus(
    orderUid: string,
    status: ResultStatus,
    correlationId: string,
  ): Promise<void> {
    const query = `
            INSERT INTO result_status (order_uid, status, correlation_id)
            VALUES ($1::uuid, $2, $3)
            ON CONFLICT (correlation_id) DO NOTHING
        `;
    try {
      await this.dbClient.query(query, [orderUid, status, correlationId]);
    } catch (error) {
      console.error("Failed to update result status", {
        error,
        orderUid,
        status,
        correlationId,
      });
      throw error;
    }
  }
}
