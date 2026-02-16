import { type DBClient } from "../db-client";

export interface Order {
  id: string;
  referenceNumber: number;
  createdAt: string;
  statusCode: string;
  statusDescription: string;
  statusDate: string;
  supplierId: string;
  supplierName: string;
  nhsNumber: string;
  birthDate: Date;
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
          o.order_reference AS referenceNumber,
          o.created_at AS createdAt,
          os.status_code AS statusCode,
          st.description AS statusDescription,
          os."timestamp" AS statusDate,
          s.supplier_id AS supplierId
          s.name AS supplierName,
          p.nhs_number AS nhsNumber,
          p.birth_date AS birthDate
      FROM hometest.test_order o
      INNER JOIN hometest.order_status os ON os.order_uid = o.order_uid
      INNER JOIN hometest.status_type st ON st.status_code = os.status_code
      INNER JOIN hometest.patient_mapping p ON p.uid = o.patient_uid
      INNER JOIN hometest.supplier s ON s.supplier_id = o.supplier_id
      WHERE o.order_uid = $1 AND p.nhs_number = $2 AND p.birth_date = $3::date
      ORDER BY os."timestamp" DESC
      LIMIT 1;
    `;

    const result = await this.dbClient.query<Order, [string, string, Date]>(
      query,
      [orderId, nhsNumber, dateOfBirth],
    );

    const rowCount = result.rowCount ?? 0;
    if (rowCount === 0) {
      return null;
    }

    return result.rows[0];
  }
}
