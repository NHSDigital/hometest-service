import { Bundle, OperationOutcome } from "@medplum/fhirtypes";

import { IOrderDetails } from "@/lib/models/order-details";
import { IPatient } from "@/lib/models/patient";
import { OrderDetailsMapper } from "@/lib/mappers/order-details-mapper";
import { backendApiEndpoint } from "@/settings";

export interface IOrderDetailsService {
  get: (orderId: string, patient: IPatient) => Promise<IOrderDetails>;
}

class OrderDetailsService implements IOrderDetailsService {
  async get(orderId: string, patient: IPatient): Promise<IOrderDetails> {
    const response = await this.getOrderFromApi(orderId, patient);

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

    const bundle: Bundle = await response.json();
    return OrderDetailsMapper.mapBundleToOrderDetails(bundle);
  }

  private async getOrderFromApi(
    orderId: string,
    patient: IPatient,
  ): Promise<Response> {
    const url = new URL(`${backendApiEndpoint}/order`);
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
