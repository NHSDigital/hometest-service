import {
  CreateOrderInput,
  OrderStatusCode,
  Supplier,
  TestOrderModel,
  UUID,
} from "../models/TestOrder";

import { BaseDbClient } from "./BaseDbClient";

export class TestOrderDbClient extends BaseDbClient {
  async getOrderByUid(orderUid: UUID): Promise<TestOrderModel | undefined> {
    const rows = await this.query<TestOrderModel>(
      `SELECT t.order_uid, t.order_reference, t.supplier_id, t.patient_uid,
              t.test_code, t.originator, t.created_at,
              s.supplier_name, p.nhs_number, p.birth_date
       FROM test_order t
       JOIN supplier s ON s.supplier_id = t.supplier_id
       JOIN patient_mapping p ON p.patient_uid = t.patient_uid
       WHERE t.order_uid = $1::uuid`,
      [orderUid],
    );
    return rows[0];
  }

  async getSupplierIdByName(supplierName: string): Promise<UUID> {
    const rows = await this.query<Supplier>(
      `SELECT supplier_id FROM supplier
       WHERE supplier_name = $1 LIMIT 1`,
      [supplierName],
    );
    return rows[0].supplier_id;
  }

  async upsertPatient(nhsNumber: string, birthDate: string): Promise<UUID> {
    const rows = await this.query<{ patient_uid: UUID }>(
      `INSERT INTO patient_mapping (nhs_number, birth_date)
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
    originator = "automatic-test",
  ): Promise<UUID> {
    const rows = await this.query<TestOrderModel>(
      `INSERT INTO test_order (supplier_id, patient_uid, test_code, originator)
       VALUES ($1::uuid, $2::uuid, $3, $4)
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
      `INSERT INTO order_status (order_uid, status_code)
       VALUES ($1::uuid, $2)`,
      [orderUid, statusCode],
    );
  }

  async updateOrderStatus(
    orderUid: UUID,
    statusCode: OrderStatusCode,
  ): Promise<void> {
    await this.query(
      `UPDATE order_status SET status_code = $2 WHERE order_uid = $1::uuid`,
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
    await this.query(`DELETE FROM order_status WHERE order_uid = $1::uuid`, [
      orderUid,
    ]);
  }

  async deleteOrderByPatientUid(patientUid: UUID): Promise<void> {
    await this.query(`DELETE FROM test_order WHERE patient_uid = $1::uuid`, [
      patientUid,
    ]);
  }

  async deletePatientMapping(nhsNumber: string,
    birthDate: string,
  ): Promise<void> {
    await this.query(
      `DELETE FROM patient_mapping
       WHERE nhs_number = $1 AND birth_date = $2::date`,
      [nhsNumber, birthDate],
    );
  }

  async deleteOrderByUid(orderUid: UUID): Promise<void> {
    await this.query(`DELETE FROM test_order WHERE order_uid = $1::uuid`, [
      orderUid,
    ]);
  }

  async getOrderStatusesByOrderUid(orderUid: string): Promise<{ status_code: string }[] | undefined> {
    const rows = await this.query<{ status_code: string }>(`
      SELECT status_code
      FROM hometest.order_status
      WHERE order_uid = $1
      ORDER BY created_at DESC
      LIMIT 2
    `, [orderUid]);

    return rows;
  }
}
<<<<<<< HEAD
=======

/**
 * Creates an order with a patient and initial status.
 * @param nhs_number - logged in user's NHS number
 * @param birth_date - logged in user's date of birth
 * @param supplier_name - name of the supplier ('Preventx' or 'SH:24')
 * @param test_code - code of the test (e.g., 'PCR')
 * @param initial_status - initial status of the order (e.g., 'ORDER_RECEIVED')
 * @returns Patient UID and Order UID of the created order
 */
 async createOrderWithPatientAndStatus(input: CreateOrderInput): Promise<{ order_uid: UUID; patient_uid: UUID; correlation_id: UUID }> {
 const patient_uid = await this.upsertPatient(input.nhs_number, input.birth_date);
 const supplier_id = await this.getSupplierIdByName(input.supplier_name);
 const order_uid = await this.createTestOrder(
  supplier_id,
  patient_uid,
  input.test_code,
  input.originator ?? 'automatic-test'
 );
 const correlation_id = await this.insertOrderStatus(order_uid, input.initial_status);

 return { order_uid, patient_uid, correlation_id };
 }

 async deletePatientByNHSandDOB(nhs_number: string, birth_date: string): Promise<void> {
    await this.query(`
      DELETE FROM hometest.patient_mapping
      WHERE nhs_number = $1 AND birth_date = $2::date
    `, [nhs_number, birth_date]);
  }

  async deleteOrderStatusByUid(orderUid: string): Promise<void> {
    await this.query(`
      DELETE FROM hometest.order_status
      WHERE order_uid = $1
    `, [orderUid]);
  }

  async deleteOrderByPatientUid(patientUid: string): Promise<void> {
    await this.query(`
      DELETE FROM hometest.test_order
      WHERE patient_uid = $1
    `, [patientUid]);
  }

    async getLatestOrderStatusByOrderUid(orderUid: string): Promise< UUID > {
    const rows = await this.query<CreateOrderResult>(`
      SELECT status_code
      FROM hometest.order_status
      WHERE order_uid = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [orderUid]);
    return rows[0].status_code as UUID;
  }
  }
>>>>>>> 05c18311 (local changes before pull)
