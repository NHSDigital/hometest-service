import { BaseDbClient } from './BaseDbClient';
import { ResultStatus } from '../models/TestResult';
import { UUID } from '../models/TestOrder';

export class TestResultDbClient extends BaseDbClient {

  async insertStatusResult(order_uid: UUID, status: ResultStatus, correlation_id: UUID): Promise<void> {
    const rows = `
      INSERT INTO hometest.result_status (order_uid, status, correlation_id)
      VALUES ($1, $2, $3)
    `;
    await this.query(rows, [order_uid, status, correlation_id]);
  }

  async deleteResultStatusByUid(orderUid: string): Promise<void> {
    await this.query(`
      DELETE FROM hometest.result_status
      WHERE order_uid = $1
    `, [orderUid]);
  }
}
