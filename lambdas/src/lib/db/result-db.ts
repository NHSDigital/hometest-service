import { Commons } from "../commons";
import { ResultStatus } from "../types/status";
import { DBClient } from "./db-client";

export class ResultService {
  private readonly dbClient: DBClient;
  private readonly commons: Commons;
  constructor(dbClient: DBClient, commons: Commons) {
    this.dbClient = dbClient;
    this.commons = commons;
  }

  async updateResultStatus(
    orderUid: string,
    status: ResultStatus,
    correlationId: string | null,
  ): Promise<void> {
    const query = `
            INSERT INTO result_status (order_uid, status, correlation_id)
            VALUES ($1::uuid, $2, $3)
        `;
    try {
      await this.dbClient.query(query, [orderUid, status, correlationId]);
    } catch (error) {
      this.commons.logError("result-db", "Failed to update result status", {
        error,
        orderUid,
        status,
        correlationId,
      });
      throw error;
    }
  }
}
