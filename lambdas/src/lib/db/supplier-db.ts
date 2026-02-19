import { Organization, Location } from "fhir/r4";
import { DBClient } from "./db-client";

export interface SupplierOffering {
  organization: Organization;
  location: Location;
}
export type LaCode = string;
export type TestCode = string;

interface SupplierRow {
  supplier_id: string;
  supplier_name: string;
  service_url: string;
  website_url: string;
  region: string;
}

type GetSupplierParams = [LaCode, TestCode | null];

export interface SupplierServiceProperties {
  dbClient: DBClient;
}

export interface SupplierConfig {
  serviceUrl: string;
  clientSecretName: string;
  clientId: string;
  oauthTokenPath: string;
  orderPath: string;
  oauthScope: string;
}

export class SupplierConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupplierConfigError";
  }
}

export interface CreateOrderResult {
  orderUid: string;
  orderReference: number;
  patientUid: string;
}

export class SupplierService {
  private readonly dbClient: DBClient;
  constructor({ dbClient }: SupplierServiceProperties) {
    this.dbClient = dbClient;
  }

  async createPatientAndOrderAndStatus(
    nhsNumber: string,
    birthDate: string,
    supplierId: string,
    testCode: string,
    originator?: string,
  ): Promise<CreateOrderResult> {
    try {
      return await this.dbClient.withTransaction(async (tx) => {
        const patientQuery = `
          INSERT INTO hometest.patient_mapping (nhs_number, birth_date)
          VALUES ($1, $2)
          ON CONFLICT (nhs_number)
          DO UPDATE SET birth_date = EXCLUDED.birth_date
          RETURNING patient_uid;
        `;

        const patientResult = await tx.query<
          { patient_uid: string },
          [string, string]
        >(patientQuery, [nhsNumber, birthDate]);

        if (patientResult.rowCount === 0 || !patientResult.rows[0]) {
          throw new Error("Failed to create or retrieve patient record");
        }

        const patientUid = patientResult.rows[0].patient_uid;

        const orderQuery = `
          INSERT INTO hometest.test_order (supplier_id, patient_uid, test_code, originator)
          VALUES ($1, $2, $3, $4)
          RETURNING order_uid, order_reference;
        `;

        const orderResult = await tx.query<
          { order_uid: string; order_reference: number },
          [string, string, string, string | undefined]
        >(orderQuery, [supplierId, patientUid, testCode, originator]);

        if (orderResult.rowCount === 0 || !orderResult.rows[0]) {
          throw new Error("Failed to create test order");
        }

        const { order_uid, order_reference } = orderResult.rows[0];

        const orderStatusQuery = `
          INSERT INTO hometest.order_status (order_uid, order_reference, status_code)
          VALUES ($1, $2, $3)
          RETURNING status_id;
        `;

        const statusResult = await tx.query<
          { status_id: string },
          [string, number, string]
        >(orderStatusQuery, [order_uid, order_reference, "GENERATED"]);

        if (statusResult.rowCount === 0 || !statusResult.rows[0]) {
          throw new Error("Failed to create order status");
        }

        return {
          orderUid: order_uid,
          orderReference: order_reference,
          patientUid: patientUid,
        };
      });
    } catch (error) {
      throw new Error("Failed to create patient and order in database", {
        cause: error,
      });
    }
  }

  async updateOrderStatus(
    orderUid: string,
    orderReference: number,
    statusCode: string,
  ): Promise<void> {
    const orderStatusQuery = `
      INSERT INTO hometest.order_status (order_uid, order_reference, status_code)
      VALUES ($1, $2, $3)
      ON CONFLICT (order_uid)
      DO UPDATE SET
        order_reference = EXCLUDED.order_reference,
        status_code = EXCLUDED.status_code,
        created_at = CURRENT_TIMESTAMP
      RETURNING status_id;
    `;

    try {
      const statusResult = await this.dbClient.query<
        { status_id: string },
        [string, number, string]
      >(orderStatusQuery, [orderUid, orderReference, statusCode]);

      if (statusResult.rowCount === 0 || !statusResult.rows[0]) {
        throw new Error("Failed to update order status");
      }
    } catch (error) {
      throw new Error("Failed to update order status", { cause: error });
    }
  }

  async getSupplierConfigBySupplierId(
    supplierId: string,
  ): Promise<SupplierConfig | null> {
    const query = `
      SELECT service_url,
            client_secret_name,
            client_id,
            oauth_token_path,
            order_path,
            oauth_scope
      FROM hometest.supplier
      WHERE supplier_id = $1
      LIMIT 1;
    `;

    try {
      const result = await this.dbClient.query<
        {
          service_url: string;
          client_secret_name: string;
          client_id: string;
          oauth_token_path: string;
          order_path: string;
          oauth_scope: string;
        },
        [string]
      >(query, [supplierId]);

      if (result.rowCount === 0) {
        return null;
      }

      const row = result.rows[0];
      if (!row.service_url) {
        throw new SupplierConfigError(
          `Supplier configuration missing service URL for supplierId ${supplierId}`,
        );
      }
      if (!row.client_id) {
        throw new SupplierConfigError(
          `Supplier configuration missing client ID for supplierId ${supplierId}`,
        );
      }
      if (!row.client_secret_name) {
        throw new SupplierConfigError(
          `Supplier configuration missing client secret name for supplierId ${supplierId}`,
        );
      }

      return {
        serviceUrl: row.service_url,
        clientSecretName: row.client_secret_name,
        clientId: row.client_id,
        oauthTokenPath: row.oauth_token_path,
        orderPath: row.order_path,
        oauthScope: row.oauth_scope,
      };
    } catch (error: any) {
      if (error instanceof SupplierConfigError) {
        throw error;
      }
      throw new Error(
        `Failed to fetch supplier config from database for supplierId ${supplierId}`,
        { cause: error },
      );
    }
  }

  async getSuppliersByLocalAuthorityAndTest(
    laCode: LaCode,
    testCode?: TestCode,
  ): Promise<SupplierOffering[]> {
    const query = `
      SELECT s.supplier_id,
            s.supplier_name,
            s.service_url,
            s.website_url
      FROM hometest.supplier s
            JOIN hometest.la_supplier_offering o ON s.supplier_id = o.supplier_id
      WHERE o.la_code = $1
        AND ($2::VARCHAR IS NULL OR o.test_code = $2)
        AND o.effective_from <= CURRENT_TIMESTAMP;
    `;

    try {
      const result = await this.dbClient.query<SupplierRow, GetSupplierParams>(
        query,
        [laCode, testCode ?? null],
      );

      if (result.rowCount === 0) {
        return [];
      }
      // need to make sure that this is the correct response shape, just a stub for now generated by AI
      return result.rows.map((supplier) => ({
        organization: {
          resourceType: "Organization",
          id: supplier.supplier_id,
          name: supplier.supplier_name,
          extension: [
            {
              url: "http://hometest.nhs.uk/fhir/StructureDefinition/service-url",
              valueUrl: supplier.service_url,
            },
          ],
        },
        location: {
          resourceType: "Location",
          id: `loc-${supplier.supplier_id}`,
          name: `${supplier.region} Service Area`,
          managingOrganization: {
            reference: `Organization/${supplier.supplier_id}`,
          },
          address: {
            postalCode: laCode,
            state: supplier.region,
          },
        },
      }));
    } catch (error) {
      const testCodeInfo = testCode ? ` and testCode ${testCode}` : "";
      throw new Error(
        `Failed to fetch suppliers from database for laCode ${laCode}${testCodeInfo}`,
        { cause: error },
      );
    }
  }
}
