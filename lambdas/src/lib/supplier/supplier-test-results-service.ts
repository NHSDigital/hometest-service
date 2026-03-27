import { Bundle, Observation } from "fhir/r4";

import { DBClient } from "../db/db-client";
import { SupplierService } from "../db/supplier-db";
import { HttpClient } from "../http/http-client";
import { TokenEncryptionClient } from "../kms/kms-client";
import { SecretsClient } from "../secrets/secrets-manager-client";
import { getTokenGenerator } from "./supplier-auth-client";

export interface SupplierTestResultsServiceProperties {
  httpClient: HttpClient;
  secretsClient: SecretsClient;
  supplierDb: SupplierService;
  dbClient: DBClient;
  encryptionClient: TokenEncryptionClient;
}

export class SupplierTestResultsService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly secretsClient: SecretsClient,
    private readonly supplierDb: SupplierService,
    private readonly dbClient: DBClient,
    private readonly encryptionClient: TokenEncryptionClient,
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

    const tokenGenerator = getTokenGenerator(
      this.httpClient,
      this.secretsClient,
      this.dbClient,
      this.encryptionClient,
      serviceConfig,
    );

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
