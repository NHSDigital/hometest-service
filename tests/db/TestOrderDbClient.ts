import { BaseDbClient } from './BaseDbClient';
import {
  CreateOrderInput,
  OrderStatusCode,
  UUID,
  Supplier,
  TestOrderModel,
} from '../models/TestOrder';

export class TestOrderDbClient extends BaseDbClient {
  async getOrderByUid(orderUid: UUID): Promise<TestOrderModel | undefined> {
    const rows = await this.query<TestOrderModel>(
      `SELECT t.order_uid, t.order_reference, t.supplier_id, t.patient_uid,
              t.test_code, t.originator, t.created_at,
              s.supplier_name, p.nhs_number, p.birth_date
       FROM hometest.test_order t
       JOIN hometest.supplier s ON s.supplier_id = t.supplier_id
       JOIN hometest.patient_mapping p ON p.patient_uid = t.patient_uid
       WHERE t.order_uid = $1::uuid`,
      [orderUid],
    );
    return rows[0];
  }

  async getSupplierIdByName(supplierName: string): Promise<UUID> {
    const rows = await this.query<Supplier>(
      `SELECT supplier_id FROM hometest.supplier
       WHERE supplier_name = $1 LIMIT 1`,
      [supplierName],
    );
    return rows[0].supplier_id;
  }

  async upsertPatient(nhsNumber: string, birthDate: string): Promise<UUID> {
    const rows = await this.query<{ patient_uid: UUID }>(
      `INSERT INTO hometest.patient_mapping (nhs_number, birth_date)
       VALUES ($1, $2::date)
       ON CONFLICT (nhs_number) DO UPDATE SET birth_date = EXCLUDED.birth_date
       RETURNING patient_uid`,
      [nhsNumber, birthDate],
    );
    return rows[0].patient_uid;
  }

  async createTestOrder(
    supplierId: UUID,
    patientUid: UUID,
    testCode: string,
    originator = 'automatic-test',
  ): Promise<UUID> {
    const rows = await this.query<TestOrderModel>(
      `INSERT INTO hometest.test_order (supplier_id, patient_uid, test_code, originator)
       VALUES ($1, $2, $3, $4)
       RETURNING order_uid`,
      [supplierId, patientUid, testCode, originator],
    );
    return rows[0].order_uid;
  }

  async insertOrderStatus(
    orderUid: UUID,
    statusCode: OrderStatusCode,
  ): Promise<void> {
    await this.query(
      `INSERT INTO hometest.order_status (order_uid, status_code)
       VALUES ($1, $2)`,
      [orderUid, statusCode],
    );
  }

  async updateOrderStatus(
    orderUid: UUID,
    statusCode: OrderStatusCode,
  ): Promise<void> {
    await this.query(
      `UPDATE hometest.order_status SET status_code = $2 WHERE order_uid = $1`,
      [orderUid, statusCode],
    );
  }

  async createOrderWithPatientAndStatus(
    input: CreateOrderInput,
  ): Promise<{ order_uid: UUID; patient_uid: UUID }> {
    const patient_uid = await this.upsertPatient(
      input.nhs_number,
      input.birth_date,
    );
    const supplier_id = await this.getSupplierIdByName(input.supplier_name);
    const order_uid = await this.createTestOrder(
      supplier_id,
      patient_uid,
      input.test_code,
      input.originator,
    );
    await this.insertOrderStatus(order_uid, input.initial_status);
    return { order_uid, patient_uid };
  }


  async deleteOrderStatusByUid(orderUid: UUID): Promise<void> {
    await this.query(`DELETE FROM hometest.order_status WHERE order_uid = $1`, [
      orderUid,
    ]);
  }

  async deleteOrderByPatientUid(patientUid: UUID): Promise<void> {
    await this.query(`DELETE FROM hometest.test_order WHERE patient_uid = $1`, [
      patientUid,
    ]);
  }

  async deletePatientByNHSandDOB(
    nhsNumber: string,
    birthDate: string,
  ): Promise<void> {
    await this.query(
      `DELETE FROM hometest.patient_mapping
       WHERE nhs_number = $1 AND birth_date = $2::date`,
      [nhsNumber, birthDate],
    );
  }
}
