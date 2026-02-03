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
    const url = new URL(`${backendApiEndpoint}/order`);
    url.searchParams.append("nhs_number", patient.nhsNumber);
    url.searchParams.append("date_of_birth", patient.dateOfBirth);
    url.searchParams.append("order_id", orderId);

    fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/fhir+json",
        Accept: "application/fhir+json",
      },
    });

    return getMockOrderDetails(orderId);
  },
};

function getMockOrderDetails(orderId: string): IOrderDetails {
  // Mock data for different order statuses
  const mockOrders: Record<string, IOrderDetails> = {
    "1": {
      id: "1",
      orderedDate: "2026-01-15",
      referenceNumber: "12345",
      status: "confirmed",
      supplier: "Preventx",
      maxDeliveryDays: 5,
    },
    "2": {
      id: "2",
      orderedDate: "2026-01-10",
      referenceNumber: "67890",
      status: "dispatched",
      supplier: "SH24",
      dispatchedDate: "2026-01-16",
      maxDeliveryDays: 5,
    },
    "3": {
      id: "3",
      orderedDate: "2025-05-04",
      referenceNumber: "11223",
      status: "received",
      supplier: "Preventx",
    },
    "4": {
      id: "4",
      orderedDate: "2025-05-04",
      referenceNumber: "12345",
      status: "ready",
      supplier: "Preventx",
    },
  };

  return mockOrders[orderId] || null;
}

export default orderDetailsService;
