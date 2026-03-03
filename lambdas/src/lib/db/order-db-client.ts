import { type DBClient } from "./db-client";

type OrderStatusCode = "CONFIRMED" | "DISPATCHED" | "RECEIVED" | "COMPLETE";

export interface Order {
  id: string;
  reference_number: number;
  created_at: Date;
  test_code: string;
  test_description: string;
  status_code: OrderStatusCode;
  status_description: string;
  status_created_at: Date;
  supplier_id: string;
  supplier_name: string;
  patient_nhs_number: string;
  patient_birth_date: Date;
}

export class OrderDbClient {
  constructor(private readonly dbClient: DBClient) {}

  public async getOrder(orderId: string, nhsNumber: string, dateOfBirth: Date) {
    const query = `
      SELECT
          o.order_uid AS id,
          o.order_reference AS reference_number,
          o.created_at AS created_at,
          o.test_code AS test_code,
          tt.description AS test_description,
          os.status_code AS status_code,
          st.description AS status_description,
          os.created_at AS status_created_at,
          s.supplier_id AS supplier_id,
          s.supplier_name AS supplier_name,
          p.nhs_number AS patient_nhs_number,
          p.birth_date AS patient_birth_date
      FROM test_order o
      INNER JOIN test_type tt ON tt.test_code = o.test_code
      INNER JOIN order_status os ON os.order_uid = o.order_uid
      INNER JOIN status_type st ON st.status_code = os.status_code
      INNER JOIN patient_mapping p ON p.patient_uid = o.patient_uid
      INNER JOIN supplier s ON s.supplier_id = o.supplier_id
      WHERE o.order_uid = $1::uuid AND p.nhs_number = $2 AND p.birth_date = $3::date
      ORDER BY os.created_at DESC
      LIMIT 1;
    `;

    const result = await this.dbClient.query<Order, [string, string, Date]>(query, [
      orderId,
      nhsNumber,
      dateOfBirth,
    ]);

    return result?.rows[0] ?? null;
  }
}
