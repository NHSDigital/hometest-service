import { DBClient } from "./db-client";

export interface ConsentRow {
  consent_uid: string;
  order_uid: string;
  created_at: string;
}

export class ConsentService {
  private readonly dbClient: DBClient;

  constructor(dbClient: DBClient) {
    this.dbClient = dbClient;
  }

  /**
  * Record consent for a given order. Only one consent row per order can exist due to a unique index on consent(order_uid).
  * Attempts to insert consent for the same order more than once will fail.
  * Validates that the consent value is true before recording.
  *
  * @param orderUid - The UUID of the order
  * @param consentValue - The consent value from the request (must be true)
  * @throws Error if consent is not true, if a consent row for the order already exists, or if database operation fails
  */
  async createConsent(orderUid: string, consentValue: boolean): Promise<ConsentRow> {
    if (consentValue !== true) {
      throw new Error(`Consent must be true to record consent for orderId ${orderUid}`);
    }

    const query = `
      INSERT INTO consent (order_uid)
      VALUES ($1::uuid)
      RETURNING consent_uid, order_uid, created_at;
    `;

    try {
      const result = await this.dbClient.query<ConsentRow, [string]>(query, [orderUid]);

      if (result.rowCount === 0 || !result.rows[0]) {
        throw new Error("Failed to insert consent record");
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to record consent for orderId ${orderUid}`, {
        cause: error,
      });
    }
  }

  /**
   * Retrieve the most recent consent record for the given order.
   * The index on consent(order_uid) enables efficient retrieval via indexed lookup.
   */
  async getConsentByOrderUid(orderUid: string): Promise<ConsentRow | null> {
    const query = `
      SELECT consent_uid, order_uid, created_at
      FROM consent
      WHERE order_uid = $1::uuid
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    try {
      const result = await this.dbClient.query<ConsentRow, [string]>(query, [orderUid]);

      return result.rowCount === 0 ? null : result.rows[0];
    } catch (error) {
      throw new Error(`Failed to fetch consent for orderId ${orderUid}`, {
        cause: error,
      });
    }
  }
}
