import { Bundle, Observation } from "fhir/r4";

import { HttpClient } from "../http/http-client";
import { getTokenGenerator } from "./supplier-auth-client";
import { SecretsClient } from "../secrets/secrets-manager-client";
import { SupplierService } from "../db/supplier-db";

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
    const serviceConfig = await this.supplierDb.getSupplierConfigBySupplierId(supplierId);

    if (!serviceConfig) {
      throw new Error("Missing supplier config for: " + supplierId);
    }

    const tokenGenerator = getTokenGenerator(this.httpClient, this.secretsClient, serviceConfig);

    const accessToken = await tokenGenerator.generateToken();

    const resultsUrl = `${serviceConfig.serviceUrl}${serviceConfig.resultsPath}`;
    const url = new URL(resultsUrl);
    url.searchParams.append("order_uid", orderId);

    const response = await this.httpClient.get<Bundle<Observation>>(url.toString(), {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/fhir+json",
      "X-Correlation-ID": correlationId,
    });

    return response;
  }
}
