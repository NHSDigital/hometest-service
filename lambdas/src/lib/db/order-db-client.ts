import { type DBClient } from "./db-client";

type OrderStatusCode =
  | "ORDER_RECEIVED"
  | "DISPATCHED"
  | "RECEIVED"
  | "COMPLETE";

export interface Order {
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

export class OrderDbClient {
  readonly dbClient: DBClient;
  constructor(dbClient: DBClient) {
    this.dbClient = dbClient;
  }

  public async getOrder(orderId: string, nhsNumber: string, dateOfBirth: Date) {
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
      INNER JOIN hometest.status_type st ON st.status_code = os.status_code
      INNER JOIN hometest.patient_mapping p ON p.patient_uid = o.patient_uid
      INNER JOIN hometest.supplier s ON s.supplier_id = o.supplier_id
      WHERE o.order_uid = $1 AND p.nhs_number = $2 AND p.birth_date = $3::date
      ORDER BY os.created_at DESC
      LIMIT 1;
    `;

    const result = await this.dbClient.query<Order, [string, string, Date]>(
      query,
      [orderId, nhsNumber, dateOfBirth],
    );

    return result?.rows[0] ?? null;
  }
}
