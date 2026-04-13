import type { OrderDbClient } from "../../db/order-db-client";
import type { OrderStatusService } from "../../db/order-status-db";
import { OrderStatusCodes } from "../../db/order-status-db";
import type { Patient, PatientDbClient } from "../../db/patient-db-client";
import { NotifyEventCode } from "../../types/notify-message";
import { OrderReceivedMessageBuilder } from "./order-received-message-builder";

describe("OrderReceivedMessageBuilder", () => {
  const mockGetPatient = jest.fn<Promise<Patient>, [string]>();
  const mockGetOrderReferenceNumber = jest.fn<Promise<string>, [string]>();
  const mockGetOrderStatusCreatedAt = jest.fn<Promise<string>, [string, string]>();

  const deps = {
    patientDbClient: { get: mockGetPatient } as Pick<PatientDbClient, "get"> as PatientDbClient,
    orderDbClient: {
      getOrderReferenceNumber: mockGetOrderReferenceNumber,
    } as Pick<OrderDbClient, "getOrderReferenceNumber"> as OrderDbClient,
    homeTestBaseUrl: "https://hometest.example.nhs.uk/",
  };

  const orderStatusService = {
    getOrderStatusCreatedAt: mockGetOrderStatusCreatedAt,
  } as Pick<OrderStatusService, "getOrderStatusCreatedAt"> as OrderStatusService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPatient.mockResolvedValue({ nhsNumber: "1234567890", birthDate: "1990-01-02" });
    mockGetOrderReferenceNumber.mockResolvedValue("100001");
    mockGetOrderStatusCreatedAt.mockResolvedValue("2026-08-06T10:00:00Z");
  });

  it("builds received notify message", async () => {
    const builder = new OrderReceivedMessageBuilder(deps, orderStatusService);

    const result = await builder.build({
      patientId: "patient-1",
      orderId: "order-2",
      correlationId: "corr-2",
    });

    expect(result.eventCode).toBe(NotifyEventCode.OrderReceived);
    expect(result.personalisation).toEqual({
      receivedDate: "6 August 2026",
      orderLinkUrl: "https://hometest.example.nhs.uk/orders/order-2/tracking",
      referenceNumber: "100001",
    });
    expect(mockGetOrderStatusCreatedAt).toHaveBeenCalledWith("order-2", OrderStatusCodes.RECEIVED);
  });
});
