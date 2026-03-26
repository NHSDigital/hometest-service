import { Bundle, Observation } from "fhir/r4";

import { SupplierService } from "../db/supplier-db";
import { HttpClient } from "../http/http-client";
import { SecretsClient } from "../secrets/secrets-manager-client";
import {
  type SupplierTokenGenerator,
  buildTokenGeneratorCacheKey,
  createTokenGenerator,
} from "./supplier-auth-client";

export class SupplierTestResultsService {
  private readonly tokenGenerators = new Map<string, SupplierTokenGenerator>();

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

    const cacheKey = buildTokenGeneratorCacheKey(serviceConfig);
    let tokenGenerator = this.tokenGenerators.get(cacheKey);

    if (!tokenGenerator) {
      tokenGenerator = createTokenGenerator(this.httpClient, this.secretsClient, serviceConfig);
      this.tokenGenerators.set(cacheKey, tokenGenerator);
    }

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
