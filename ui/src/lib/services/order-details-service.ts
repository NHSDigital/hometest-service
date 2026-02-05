import { IOrderDetails } from "@/lib/models/order-details";
import { IPatient } from "@/lib/models/patient";
import { backendApiEndpoint } from "@/settings";

export interface IOrderDetailsService {
  get: (orderId: string, patient: IPatient) => Promise<IOrderDetails>;
}

const orderDetailsService: IOrderDetailsService = {
  get: async function (
    orderId: string,
    patient: IPatient,
  ): Promise<IOrderDetails> {
    try {
      const url = new URL(`${backendApiEndpoint}/order`);
      url.searchParams.append("nhs_number", patient.nhsNumber);
      url.searchParams.append("date_of_birth", patient.dateOfBirth);
      url.searchParams.append("order_id", orderId);
      
      const result = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/fhir+json",
        },
      });

      const fhirBundle = await result.json();

      if (fhirBundle.entry && fhirBundle.entry.length > 0) {
        const serviceRequest = fhirBundle.entry[0].resource;
        return {
          id: serviceRequest.id || "",
          orderedDate: serviceRequest.authoredOn || "",
          referenceNumber: serviceRequest.identifier?.[0]?.value || "",
          status: serviceRequest?.extension?.[0]?.valueCodeableConcept?.text,
          supplier: serviceRequest.performer?.[0]?.display || "",
          dispatchedDate: undefined,
          maxDeliveryDays: undefined,
        };
      } else {
        throw new Error("not found");
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
};

export default orderDetailsService;
