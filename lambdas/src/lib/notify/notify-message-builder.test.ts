import type { OrderDbClient } from "../db/order-db-client";
import type { OrderStatusService } from "../db/order-status-db";
import { OrderStatusCodes } from "../db/order-status-db";
import type { Patient, PatientDbClient } from "../db/patient-db-client";
import { NotifyEventCode } from "../types/notify-message";
import { NotifyMessageBuilder } from "./notify-message-builder";

describe("NotifyMessageBuilder", () => {
  const mockGetPatient = jest.fn<Promise<Patient>, [string]>();
  const mockGetOrderCreatedAt = jest.fn<Promise<string>, [string]>();
  const mockGetOrderReferenceNumber = jest.fn<Promise<number>, [string]>();
  const mockGetOrderStatusCreatedAt = jest.fn<Promise<string>, [string, string]>();

  const mockPatientDbClient: Pick<PatientDbClient, "get"> = {
    get: mockGetPatient,
  };

  const mockOrderDbClient: Pick<OrderDbClient, "getOrderCreatedAt" | "getOrderReferenceNumber"> = {
    getOrderCreatedAt: mockGetOrderCreatedAt,
    getOrderReferenceNumber: mockGetOrderReferenceNumber,
  };

  const mockOrderStatusService: Pick<OrderStatusService, "getOrderStatusCreatedAt"> = {
    getOrderStatusCreatedAt: mockGetOrderStatusCreatedAt,
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
      mockOrderDbClient as OrderDbClient,
      mockOrderStatusService as OrderStatusService,
      "https://hometest.example.nhs.uk",
    );
  });

  it("should build dispatched notify message with formatted date and tracking url", async () => {
    mockGetOrderStatusCreatedAt.mockResolvedValue("2026-08-06T10:00:00Z");
    mockGetOrderReferenceNumber.mockResolvedValue(100001);

    const result = await builder.buildOrderDispatchedNotifyMessage({
      patientId: "550e8400-e29b-41d4-a716-446655440111",
      correlationId: "123e4567-e89b-12d3-a456-426614174000",
      orderId: "550e8400-e29b-41d4-a716-446655440000",
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
      referenceNumber: "100001",
    });

    expect(mockGetOrderStatusCreatedAt).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
      OrderStatusCodes.DISPATCHED,
    );
    expect(mockGetOrderReferenceNumber).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("should normalize trailing slash in base url", async () => {
    mockGetOrderStatusCreatedAt.mockResolvedValue("2026-08-06T10:00:00Z");
    mockGetOrderReferenceNumber.mockResolvedValue(100001);

    const trailingSlashBuilder = new NotifyMessageBuilder(
      mockPatientDbClient as PatientDbClient,
      mockOrderDbClient as OrderDbClient,
      mockOrderStatusService as OrderStatusService,
      "https://hometest.example.nhs.uk/",
    );

    const result = await trailingSlashBuilder.buildOrderDispatchedNotifyMessage({
      patientId: "550e8400-e29b-41d4-a716-446655440111",
      correlationId: "123e4567-e89b-12d3-a456-426614174000",
      orderId: "550e8400-e29b-41d4-a716-446655440000",
    });

    const orderLinkUrl = result.personalisation?.orderLinkUrl;

    expect(typeof orderLinkUrl).toBe("string");
    expect(orderLinkUrl).toContain(
      "https://hometest.example.nhs.uk/orders/550e8400-e29b-41d4-a716-446655440000/tracking",
    );
    expect(orderLinkUrl).not.toContain(".uk//orders");
  });

  it("should call recipient lookup with patient id", async () => {
    mockGetOrderStatusCreatedAt.mockResolvedValue("2026-08-06T10:00:00Z");
    mockGetOrderReferenceNumber.mockResolvedValue(100001);

    await builder.buildOrderDispatchedNotifyMessage({
      patientId: "550e8400-e29b-41d4-a716-446655440111",
      correlationId: "123e4567-e89b-12d3-a456-426614174000",
      orderId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(mockGetPatient).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440111");
  });

  it("should build received notify message with receivedDate in personalisation", async () => {
    mockGetOrderStatusCreatedAt.mockResolvedValue("2026-08-06T10:00:00Z");
    mockGetOrderReferenceNumber.mockResolvedValue(100001);

    const result = await builder.buildOrderReceivedNotifyMessage({
      patientId: "550e8400-e29b-41d4-a716-446655440111",
      correlationId: "123e4567-e89b-12d3-a456-426614174000",
      orderId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.correlationId).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(result.eventCode).toBe(NotifyEventCode.OrderReceived);
    expect(result.personalisation).toEqual({
      receivedDate: "6 August 2026",
      orderLinkUrl:
        "https://hometest.example.nhs.uk/orders/550e8400-e29b-41d4-a716-446655440000/tracking",
      referenceNumber: "100001",
    });

    expect(mockGetOrderStatusCreatedAt).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
      OrderStatusCodes.RECEIVED,
    );
  });

  it("should build result available notify message with orderedDate in personalisation", async () => {
    mockGetOrderCreatedAt.mockResolvedValue("2026-08-05T10:00:00Z");
    mockGetOrderReferenceNumber.mockResolvedValue(100001);

    const result = await builder.buildOrderResultAvailableNotifyMessage({
      patientId: "550e8400-e29b-41d4-a716-446655440111",
      correlationId: "123e4567-e89b-12d3-a456-426614174000",
      orderId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.correlationId).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(result.eventCode).toBe(NotifyEventCode.ResultReady);
    expect(result.personalisation).toEqual({
      orderedDate: "5 August 2026",
      resultLinkUrl:
        "https://hometest.example.nhs.uk/orders/550e8400-e29b-41d4-a716-446655440000/results",
      referenceNumber: "100001",
    });

    expect(mockGetOrderCreatedAt).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000");
  });
});
