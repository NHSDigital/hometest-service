import { type DBClient } from "../db-client";

export interface Order {
  id: string;
  referenceNumber: number;
  createdAt: string;
  statusCode: string;
  statusDescription: string;
  timestamp: string;
  supplierName: string;
}

export class OrderDbClient {
  readonly dbClient: DBClient;
  constructor(dbClient: DBClient) {
    this.dbClient = dbClient;
  }

  public async getOrder(
    orderId: string,
    nhsNumber: string,
    dateOfBirth: Date,
  ) {
    // todo veryfication on schema
    // does order status keep history? does needs for limit 1 and ordering?
    // is nhs number unified? or I need check different formats
    const query = `
      SELECT
          o.order_uid AS id,
          o.order_reference AS referenceNumber,
          o.created_at AS createdAt,
          os.status_code AS statusCode,
          st.description AS statusDescription,
          os."timestamp",
          s.name AS supplierName
      FROM hometest."order" o
      INNER JOIN hometest.order_status os ON os.order_uid = o.order_uid
      INNER JOIN hometest.status_type st ON st.status_code = os.status_code
      INNER JOIN hometest.patient_mapping p ON p.uid = o.patient_uid
      INNER JOIN hometest.supplier s ON s.supplier_id = o.supplier_id
      WHERE o.order_uid = $1 AND p.nhs_number = $2 AND p.birth_date = $3::date;
    `;

    const result = await this.dbClient.query<Order, [string, string, Date]>(
      query,
      [orderId, nhsNumber, dateOfBirth],
    );

    const rowCount = result.rowCount ?? 0;
    if (rowCount === 0) {
      throw new Error("Not found");
    }

    if (rowCount > 1) {
      // todo handling base on schema
      throw new Error("Something wrong");
    }

    return result.rows[0];
  }
}
