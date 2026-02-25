import { OperationOutcome } from "fhir/r4";

import { Patient } from "@/lib/models/patient";
import { TestResult } from "@/lib/models/test-result";
import { backendUrl } from "@/settings";

class TestResultsService {
  async get(orderId: string, patient: Patient): Promise<TestResult | null> {
    const response = await this.getResultFromApi(orderId, patient);

    if (response.status === 404) {
      return null;
    }

    if (response.status !== 200) {
      const operationOutcome: OperationOutcome = await response.json();
      const issue = operationOutcome.issue?.[0];
      const errorMessage =
        issue?.details?.text ??
        issue?.diagnostics ??
        issue?.code ??
        "Unknown error";

      throw new Error(errorMessage);
    }

    const observation: { id?: string } = await response.json();
    return { id: observation.id ?? "" };
  }

  private async getResultFromApi(
    orderId: string,
    patient: Patient,
  ): Promise<Response> {
    const url = new URL(`${backendUrl}/results`);
    url.searchParams.append("nhs_number", patient.nhsNumber);
    url.searchParams.append("date_of_birth", patient.dateOfBirth);
    url.searchParams.append("order_id", orderId);

    return fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
        "x-correlation-id": crypto.randomUUID(),
      },
    });
  }
}

const testResultsService = new TestResultsService();
export default testResultsService;
