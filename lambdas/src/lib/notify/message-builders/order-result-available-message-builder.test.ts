import type { OrderDbClient } from "../../db/order-db-client";
import type { Patient, PatientDbClient } from "../../db/patient-db-client";
import { NotifyEventCode } from "../../types/notify-message";
import { OrderResultAvailableMessageBuilder } from "./order-result-available-message-builder";

describe("OrderResultAvailableMessageBuilder", () => {
  const mockGetPatient = jest.fn<Promise<Patient>, [string]>();
  const mockGetOrderReferenceNumber = jest.fn<Promise<string>, [string]>();
  const mockGetOrderCreatedAt = jest.fn<Promise<string>, [string]>();

  const deps = {
    patientDbClient: { get: mockGetPatient } as Pick<PatientDbClient, "get"> as PatientDbClient,
    orderDbClient: {
      getOrderReferenceNumber: mockGetOrderReferenceNumber,
      getOrderCreatedAt: mockGetOrderCreatedAt,
    } as Pick<OrderDbClient, "getOrderReferenceNumber" | "getOrderCreatedAt"> as OrderDbClient,
    homeTestBaseUrl: "https://hometest.example.nhs.uk/",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPatient.mockResolvedValue({ nhsNumber: "1234567890", birthDate: "1990-01-02" });
    mockGetOrderReferenceNumber.mockResolvedValue("100001");
    mockGetOrderCreatedAt.mockResolvedValue("2026-08-05T10:00:00Z");
  });

  it("builds result available notify message", async () => {
    const builder = new OrderResultAvailableMessageBuilder(deps);

    const result = await builder.build({
      patientId: "patient-2",
      orderId: "order-3",
      correlationId: "corr-3",
    });

    expect(result.eventCode).toBe(NotifyEventCode.ResultReady);
    expect(result.personalisation).toEqual({
      orderedDate: "5 August 2026",
      resultLinkUrl: "https://hometest.example.nhs.uk/orders/order-3/results",
      referenceNumber: "100001",
    });
    expect(mockGetOrderCreatedAt).toHaveBeenCalledWith("order-3");
  });
});
