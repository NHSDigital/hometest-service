import { BaseDbClient } from './BaseDbClient';
import { TestOrderRow, CreateOrderInput, OrderStatusCode, UUID, PatientMapping, Supplier, TestOrder, CreateOrderResult } from '../models/TestOrder';
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
      FROM hometest.test_order t
      JOIN hometest.supplier s ON s.supplier_id = t.supplier_id
      JOIN hometest.patient_mapping p ON p.patient_uid = t.patient_uid
      WHERE t.order_uid = $1
    `, [orderUid]);
    return rows[0];
  }

  async deleteOrderByUid(orderUid: string): Promise<void> {
    await this.query(`
      DELETE FROM hometest.test_order
      WHERE order_uid = $1
    `, [orderUid]);
  }

  /**
   * Check if a patient exists by NHS number and DOB. If they exist, update their DOB. If not, create a new patient record.
   * @param nhs_number nhs number of the logged in user
   * @param birth_date date of birth of the logged in user
   * @returns patient UID
   */
  async upsertPatient(nhs_number: string, birth_date: string): Promise<UUID> {
    // Check if patient exists in the database
    const findPatient = await this.query<PatientMapping>(`
      SELECT patient_uid
      FROM hometest.patient_mapping
      WHERE nhs_number = $1
      LIMIT 1
    `, [nhs_number]);

    // If patient exists, update the birth_date
    if (findPatient.length > 0) {
      const patient_uid: UUID = findPatient[0].patient_uid;

      await this.query(`
        UPDATE hometest.patient_mapping
        SET birth_date = $1::date
        WHERE patient_uid = $2
      `, [birth_date, patient_uid]);
      return patient_uid;
    }

    // Patient doesn't exist, insert new patient
    const rows = await this.query<{ patient_uid: UUID }>(`
      INSERT INTO hometest.patient_mapping (nhs_number, birth_date)
      VALUES ($1, $2::date)
      RETURNING patient_uid
    `, [nhs_number, birth_date]);
    return rows[0].patient_uid;
  }

 async getSupplierIdByName(supplier_name: string): Promise<UUID> {
 const rows = await this.query<Supplier>(`
  SELECT supplier_id
  FROM hometest.supplier
  WHERE supplier_name = $1
  LIMIT 1
 `,  [supplier_name]);

 return rows[0].supplier_id as UUID;
 }

 async createTestOrder(
 supplier_id: UUID,
 patient_uid: UUID,
 test_code: string,
 originator = 'automatic-test'
 ): Promise<UUID> {
 const rows = await this.query<TestOrder>(`
  INSERT INTO hometest.test_order (supplier_id, patient_uid, test_code, originator)
  VALUES ($1, $2, $3, $4)
  RETURNING order_uid
 `, [supplier_id, patient_uid, test_code, originator]);
 return rows[0].order_uid as UUID;
 }

 async insertOrderStatus(order_uid: UUID, status_code: OrderStatusCode): Promise<UUID> {
 const rows = await this.query<CreateOrderResult>(`
  INSERT INTO hometest.order_status (order_uid, status_code)
  VALUES ($1, $2)
  RETURNING correlation_id
 `, [order_uid, status_code]);
 return rows[0].correlation_id as UUID;
 }

 async updateOrderStatus(order_uid: UUID, status_code: OrderStatusCode): Promise<void> {
 await this.query<Supplier>(`
  UPDATE hometest.order_status
  SET status_code = $2
  WHERE order_uid = $1
 `, [order_uid, status_code])

}

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
  }
