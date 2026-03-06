import { Location, Organization } from "fhir/r4";

import { DBClient } from "./db-client";

export interface SupplierOffering {
  organization: Organization;
  location: Location;
  testCode: string;
}
export type LaCode = string;
export type TestCode = string;

interface SupplierRow {
  supplier_id: string;
  supplier_name: string;
  service_url: string;
  website_url: string;
  region?: string;
  test_code: string;
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
  oauthScope: string;
  orderPath: string;
  resultsPath: string;
}

export class SupplierConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupplierConfigError";
  }
}

export class SupplierService {
  private readonly dbClient: DBClient;
  constructor({ dbClient }: SupplierServiceProperties) {
    this.dbClient = dbClient;
  }

  async getSupplierConfigBySupplierId(supplierId: string): Promise<SupplierConfig | null> {
    const query = `
      SELECT service_url,
            client_secret_name,
            client_id,
            oauth_token_path,
            oauth_scope,
            order_path,
            results_path
      FROM supplier
      WHERE supplier_id = $1::uuid
      LIMIT 1;
    `;

    try {
      const result = await this.dbClient.query<
        {
          service_url: string;
          client_secret_name: string;
          client_id: string;
          oauth_token_path: string;
          oauth_scope: string;
          order_path: string;
          results_path: string;
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
        oauthScope: row.oauth_scope,
        orderPath: row.order_path,
        resultsPath: row.results_path,
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

  async getSuppliersByLaCode(laCode: LaCode): Promise<{ id: string; name: string }[]> {
    const query = `
      SELECT s.supplier_id,
             s.supplier_name
      FROM supplier s
             JOIN la_supplier_offering o
                  ON s.supplier_id = o.supplier_id
      WHERE o.la_code = $1;
    `;

    try {
      const result = await this.dbClient.query<
        { supplier_id: string; supplier_name: string },
        [string]
      >(query, [laCode]);

      if (result.rowCount === 0) {
        return [];
      }

      return result.rows.map((row) => ({
        id: row.supplier_id,
        name: row.supplier_name,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch suppliers for laCode ${laCode}`, { cause: error });
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
            s.website_url,
            o.test_code
      FROM supplier s
            JOIN la_supplier_offering o ON s.supplier_id = o.supplier_id
      WHERE o.la_code = $1
        AND ($2::VARCHAR IS NULL OR o.test_code = $2)
        AND o.effective_from <= CURRENT_TIMESTAMP;
    `;

    try {
      const result = await this.dbClient.query<SupplierRow, GetSupplierParams>(query, [
        laCode,
        testCode ?? null,
      ]);

      if (result.rowCount === 0) {
        return [];
      }
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
          name: supplier.region ? `${supplier.region} Service Area` : undefined,
          managingOrganization: {
            reference: `Organization/${supplier.supplier_id}`,
          },
          address: {
            postalCode: laCode,
            state: supplier.region,
          },
        },
        testCode: supplier.test_code,
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
