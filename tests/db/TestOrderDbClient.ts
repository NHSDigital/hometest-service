import { BaseDbClient } from './BaseDbClient';
import { TestOrderRow } from '../models/TestOrder';

export class TestOrderDbClient extends BaseDbClient {

  async getOrderByUid(orderUid: string): Promise<TestOrderRow | undefined> {
    const rows = await this.query<TestOrderRow>(`
      SELECT
        t.order_uid,
        t.order_reference,
        t.supplier_id,
        t.patient_uid,
        t.test_code,
        t.originator,
        t.created_at,
        s.supplier_name,
        p.nhs_number,
        p.birth_date
      FROM test_order t
      JOIN supplier s ON s.supplier_id = t.supplier_id
      JOIN patient_mapping p ON p.patient_uid = t.patient_uid
      WHERE t.order_uid = $1
    `, [orderUid]);
    return rows[0];
  }

  async deleteOrderByUid(orderUid: string): Promise<void> {
    await this.query(`
      DELETE FROM test_order
      WHERE order_uid = $1
    `, [orderUid]);
  }
}
