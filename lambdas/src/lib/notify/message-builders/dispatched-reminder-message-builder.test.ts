import type { OrderDbClient } from "../../db/order-db-client";
import type { OrderStatusService } from "../../db/order-status-db";
import { OrderStatusCodes } from "../../db/order-status-db";
import type { Patient, PatientDbClient } from "../../db/patient-db-client";
import { NotifyEventCode } from "../../types/notify-message";
import { DispatchedReminderMessageBuilder } from "./dispatched-reminder-message-builder";

describe("DispatchedReminderMessageBuilder", () => {
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

  it("builds dispatched reminder message using reminder id as message reference", async () => {
    const builder = new DispatchedReminderMessageBuilder(deps, orderStatusService);

    const result = await builder.build({
      reminderId: "rem-1",
      patientId: "patient-3",
      orderId: "order-4",
      correlationId: "corr-4",
      eventCode: NotifyEventCode.DispatchedInitialReminder,
    });

    expect(result.eventCode).toBe(NotifyEventCode.DispatchedInitialReminder);
    expect(result.messageReference).toBe("rem-1");
    expect(result.personalisation).toEqual({
      dispatchedDate: "6 August 2026",
      orderLinkUrl: "https://hometest.example.nhs.uk/orders/order-4/tracking",
      referenceNumber: "100001",
    });
    expect(mockGetOrderStatusCreatedAt).toHaveBeenCalledWith(
      "order-4",
      OrderStatusCodes.DISPATCHED,
    );
  });
});
