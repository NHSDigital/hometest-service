import { UUID } from "../models/TestOrder";
import { ResultStatus, TestResult } from "../models/TestResult";
import { BaseDbClient } from "./BaseDbClient";

export class TestResultDbClient extends BaseDbClient {
  async insertStatusResult(
    order_uid: UUID,
    status: ResultStatus,
    correlation_id: UUID,
  ): Promise<void> {
    const rows = `
      INSERT INTO result_status (order_uid, status, correlation_id)
      VALUES ($1, $2, $3)
    `;
    await this.query(rows, [order_uid, status, correlation_id]);
  }

  async deleteResultStatusByUid(orderUid: UUID): Promise<void> {
    await this.query(
      `
      DELETE FROM result_status
      WHERE order_uid = $1
    `,
      [orderUid],
    );
  }

  async updateResultStatus(order_uid: UUID, status: ResultStatus): Promise<void> {
    const rows = `
      UPDATE result_status
      SET status = $2
      WHERE order_uid = $1
    `;
    await this.query(rows, [order_uid, status]);
  }

  async getLatestResultStatusByOrderUid(orderUid: UUID): Promise<ResultStatus> {
    const rows = await this.query<TestResult>(
      `
      SELECT status
      FROM result_status
      WHERE order_uid = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
      [orderUid],
    );
    return rows[0].status as ResultStatus;
  }

  async getResultStatusCountByOrderUid(orderUid: UUID): Promise<number> {
    const rows = await this.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM result_status WHERE order_uid = $1`,
      [orderUid],
    );
    return Number(rows[0].count);
  }
}
