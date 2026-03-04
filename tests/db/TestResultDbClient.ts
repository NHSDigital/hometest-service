import { BaseDbClient } from "./BaseDbClient";
import { UUID } from "../models/TestOrder";
import { ResultStatus, TestResult } from "../models/TestResult";

export class TestResultDbClient extends BaseDbClient {
  async insertStatusResult(
    order_uid: UUID,
    status: ResultStatus,
    correlation_id: UUID,
  ): Promise<void> {
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
      DELETE FROM hometest.result_status
      WHERE order_uid = $1
    `,
      [orderUid],
    );
    `,
      [orderUid],
    );
  }

  async getLatestResultStatusByOrderUid(orderUid: UUID): Promise<ResultStatus> {
    const rows = await this.query<TestResult>(
      `
      SELECT status
      FROM hometest.result_status
      WHERE order_uid = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
      [orderUid],
    );
    return rows[0].status as ResultStatus;
  }
}
