import { Bundle, OperationOutcome } from "fhir/r4";

import { OrderDetailsMapper } from "@/lib/mappers/order-details-mapper";
import { OrderDetails } from "@/lib/models/order-details";
import { Patient } from "@/lib/models/patient";
import { backendUrl } from "@/settings";

class OrderDetailsService {
  async get(orderId: string, patient: Patient): Promise<OrderDetails | null> {
    const response = await this.getOrderFromApi(orderId, patient);

    if (response.status !== 200) {
      const operationOutcome: OperationOutcome = await response.json();
      const issue = operationOutcome.issue?.[0];
      if (issue.code === "not-found") {
        return null;
      }

      const errorMessage =
        issue?.details?.text ?? issue?.diagnostics ?? issue?.code ?? "Unknown error";
      if (errorMessage === "") throw new Error(errorMessage);
    }

    const bundle: Bundle = await response.json();
    return OrderDetailsMapper.mapBundleToOrderDetails(bundle);
  }

  private async getOrderFromApi(orderId: string, patient: Patient): Promise<Response> {
    const url = new URL(`${backendUrl}/get-order`);
    url.searchParams.append("nhs_number", patient.nhsNumber);
    url.searchParams.append("date_of_birth", patient.dateOfBirth);
    url.searchParams.append("order_id", orderId);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/fhir+json",
      },
    });

    return response;
  }
}

const orderDetailsService = new OrderDetailsService();
export default orderDetailsService;
