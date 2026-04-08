import type { Patient, PatientDbClient } from "../lib/db/patient-db-client";
import { NotifyEventCode } from "../lib/types/notify-message";
import { NotifyMessageBuilder } from "./notify-message-builder";

describe("NotifyMessageBuilder", () => {
  const mockGetPatient = jest.fn<Promise<Patient>, [string]>();

  const mockPatientDbClient: Pick<PatientDbClient, "get"> = {
    get: mockGetPatient,
  };

  let builder: NotifyMessageBuilder;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPatient.mockResolvedValue({
      nhsNumber: "1234567890",
      birthDate: "1990-01-02",
    });

    builder = new NotifyMessageBuilder(
      mockPatientDbClient as PatientDbClient,
      "https://hometest.example.nhs.uk",
    );
  });

  it("should build dispatched notify message with formatted date and tracking url", async () => {
    const result = await builder.buildOrderDispatchedNotifyMessage({
      patientId: "550e8400-e29b-41d4-a716-446655440111",
      correlationId: "123e4567-e89b-12d3-a456-426614174000",
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      dispatchedAt: "2026-08-06T10:00:00Z",
    });

    expect(result.correlationId).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(result.eventCode).toBe(NotifyEventCode.OrderDispatched);
    expect(result.recipient).toEqual({
      nhsNumber: "1234567890",
      dateOfBirth: "1990-01-02",
    });

    expect(result.personalisation).toEqual({
      dispatchedDate: "6 August 2026",
      orderLinkUrl:
        "https://hometest.example.nhs.uk/orders/550e8400-e29b-41d4-a716-446655440000/tracking",
    });
  });

  it("should normalize trailing slash in base url", async () => {
    const trailingSlashBuilder = new NotifyMessageBuilder(
      mockPatientDbClient as PatientDbClient,
      "https://hometest.example.nhs.uk/",
    );

    const result = await trailingSlashBuilder.buildOrderDispatchedNotifyMessage({
      patientId: "550e8400-e29b-41d4-a716-446655440111",
      correlationId: "123e4567-e89b-12d3-a456-426614174000",
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      dispatchedAt: "2026-08-06T10:00:00Z",
    });

    const orderLinkUrl = result.personalisation?.orderLinkUrl;

    expect(typeof orderLinkUrl).toBe("string");
    expect(orderLinkUrl).toContain(
      "https://hometest.example.nhs.uk/orders/550e8400-e29b-41d4-a716-446655440000/tracking",
    );
    expect(orderLinkUrl).not.toContain(".uk//orders");
  });

  it("should call recipient lookup with patient id", async () => {
    await builder.buildOrderDispatchedNotifyMessage({
      patientId: "550e8400-e29b-41d4-a716-446655440111",
      correlationId: "123e4567-e89b-12d3-a456-426614174000",
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      dispatchedAt: "2026-08-06T10:00:00Z",
    });

    expect(mockGetPatient).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440111");
  });

  it("should build received notify message with receivedDate in personalisation", async () => {
    const result = await builder.buildOrderReceivedNotifyMessage({
      patientId: "550e8400-e29b-41d4-a716-446655440111",
      correlationId: "123e4567-e89b-12d3-a456-426614174000",
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      receivedAt: "2026-08-06T10:00:00Z",
    });

    expect(result.correlationId).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(result.eventCode).toBe(NotifyEventCode.OrderReceived);
    expect(result.personalisation).toEqual({
      receivedDate: "6 August 2026",
      orderLinkUrl:
        "https://hometest.example.nhs.uk/orders/550e8400-e29b-41d4-a716-446655440000/tracking",
    });
  });
});
