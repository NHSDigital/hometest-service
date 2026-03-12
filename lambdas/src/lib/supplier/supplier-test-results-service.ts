import { Bundle, Observation } from "fhir/r4";

import { HttpClient } from "../http/http-client";
import { OAuthSupplierAuthClient } from "./supplier-auth-client";
import { SecretsClient } from "../secrets/secrets-manager-client";
import { SupplierService } from "../db/supplier-db";

export interface SupplierTestResultsServiceProperties {
  httpClient: HttpClient;
  secretsClient: SecretsClient;
  supplierDb: SupplierService;
}

export class SupplierTestResultsService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly secretsClient: SecretsClient,
    private readonly supplierDb: SupplierService,
  ) {}

  async getResults(
    orderId: string,
    supplierId: string,
    correlationId: string,
  ): Promise<Bundle<Observation>> {
    console.log(`Supplier ${supplierId} - Getting supplier config`);

    const serviceConfig = await this.supplierDb.getSupplierConfigBySupplierId(supplierId);

    if (!serviceConfig) {
      throw new Error("Missing supplier config for: " + supplierId);
    }

    console.log(`Supplier ${supplierId} - Supplier config retrieved successfully`, {
      supplierId,
      serviceConfig: JSON.stringify(serviceConfig),
    })

    const supplierAuthClient = OAuthSupplierAuthClient.fromSupplierConfig(
      this.httpClient,
      this.secretsClient,
      serviceConfig,
    );

    console.log(`Supplier ${supplierId} - Fetching access token`);

    const accessToken = await supplierAuthClient.getAccessToken();

    console.log(`Supplier ${supplierId} - Access token fetched successfully`)

    const resultsUrl = `${serviceConfig.serviceUrl}${serviceConfig.resultsPath}`;
    const url = new URL(resultsUrl);
    url.searchParams.append("order_uid", orderId);

    console.log(`Supplier ${supplierId} - Fetching results from: ${url.toString()}`);

    const response = await this.httpClient.get<Bundle<Observation>>(url.toString(), {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/fhir+json",
      "X-Correlation-ID": correlationId,
    });

    console.log(`Supplier ${supplierId} - Results fetched successfully`, {
      supplierId,
      correlationId,
      response: JSON.stringify(response),
    });

    return response;
  }
}
