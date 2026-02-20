import { type DBClient } from "./db-client";

type TestResultStatusCode = "RESULT_AVAILABLE" | "RESULT_WITHHELD";

export interface TestResult {
  id: string;
  status: TestResultStatusCode;
  created_at: Date;
  order_id: string;
  supplier_id: string;
  supplier_name: string;
  patient_id: string;
}

export class TestResultDbClient {
  readonly dbClient: DBClient;
  constructor(dbClient: DBClient) {
    this.dbClient = dbClient;
  }

  public async getResult(
    orderId: string,
    nhsNumber: string,
    dateOfBirth: Date,
  ) {
    const query = `
      SELECT
          rs.result_id AS id,
          rs.status as status,
          rs.created_at AS created_at,
          o.order_uid AS order_id,
          s.supplier_id AS supplier_id,
          s.supplier_name AS supplier_name,
          p.patient_uid AS patient_id
      FROM hometest.test_order o
      INNER JOIN hometest.patient_mapping p ON p.patient_uid = o.patient_uid
      INNER JOIN hometest.supplier s ON s.supplier_id = o.supplier_id
      INNER JOIN hometest.result_status rs ON o.order_uid = o.order_uid
      WHERE
          (
            SELECT os.status_code = 'COMPLETE'
            FROM hometest.order_status os
            WHERE os.order_uid = $1
            ORDER BY os.created_at DESC
            LIMIT 1
          ) AND
          o.order_uid = $1 AND
          p.nhs_number = $2 AND
          p.birth_date = $3::date
      ORDER BY rs.created_at DESC
      LIMIT 1;
    `;

    const result = await this.dbClient.query<
      TestResult,
      [string, string, Date]
    >(query, [orderId, nhsNumber, dateOfBirth]);

    return result?.rows[0] ?? null;
  }
}
