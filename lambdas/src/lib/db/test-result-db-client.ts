import { type DBClient } from "./db-client";

type OrderStatusCode =
  | "ORDER_RECEIVED"
  | "DISPATCHED"
  | "RECEIVED"
  | "COMPLETE";

export interface TestResult {
  id: string;
  reference_number: number;
  created_at: Date;
  status_code: OrderStatusCode;
  status_description: string;
  status_created_at: Date;
  supplier_id: string;
  supplier_name: string;
  patient_nhs_number: string;
  patient_birth_date: Date;
}

export class TestResultDbClient {
  readonly dbClient: DBClient;
  constructor(dbClient: DBClient) {
    this.dbClient = dbClient;
  }

  public async getResult(orderId: string, nhsNumber: string, dateOfBirth: Date) {
    //todo replace
    // ensure about where COMPLETE, can they update from complete to lower status?
    const query = `
      SELECT
          o.order_uid AS id,
          o.order_reference AS reference_number,
          o.created_at AS created_at,
          os.status_code AS status_code,
          st.description AS status_description,
          os.created_at AS status_created_at,
          s.supplier_id AS supplier_id,
          s.supplier_name AS supplier_name,
          p.nhs_number AS patient_nhs_number,
          p.birth_date AS patient_birth_date
      FROM hometest.test_order o
      INNER JOIN hometest.order_status os ON os.order_uid = o.order_uid
      INNER JOIN hometest.patient_mapping p ON p.patient_uid = o.patient_uid
      INNER JOIN hometest.supplier s ON s.supplier_id = o.supplier_id
      INNER JOIN hometest.result_status rs ON os.order_uid = o.order_uid
      WHERE o.order_uid = $1 AND p.nhs_number = $2 AND p.birth_date = $3::date AND os.status_code = 'COMPLETE'
      ORDER BY rs.created_at DESC
      LIMIT 1;
    `;

    const result = await this.dbClient.query<TestResult, [string, string, Date]>(
      query,
      [orderId, nhsNumber, dateOfBirth],
    );

    return result?.rows[0] ?? null;
  }
}
