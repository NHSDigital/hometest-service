import type { OrderDbClient } from "../../../db/order-db-client";
import type { OrderStatusService } from "../../../db/order-status-db";
import { OrderStatusCodes } from "../../../db/order-status-db";
import type { Patient, PatientDbClient } from "../../../db/patient-db-client";
import { NotifyEventCode } from "../../../types/notify-message";
import type { NotifyMessageBuilderDependencies } from "../base-notify-message-builder";
import { OrderConfirmedMessageBuilder } from "./order-confirmed-message-builder";
import { OrderDispatchedMessageBuilder } from "./order-dispatched-message-builder";
import { OrderReceivedMessageBuilder } from "./order-received-message-builder";
import { OrderResultAvailableMessageBuilder } from "./order-result-available-message-builder";

describe("Order status notify message builders", () => {
  const mockGetPatient = jest.fn<Promise<Patient>, [string]>();
  const mockGetOrderReferenceNumber = jest.fn<Promise<string>, [string]>();
  const mockGetOrderStatusCreatedAt = jest.fn<Promise<string>, [string, string]>();
  const mockGetOrderCreatedAt = jest.fn<Promise<string>, [string]>();

  const deps: NotifyMessageBuilderDependencies = {
    patientDbClient: { get: mockGetPatient } as Pick<PatientDbClient, "get"> as PatientDbClient,
    orderDbClient: {
      getOrderReferenceNumber: mockGetOrderReferenceNumber,
      getOrderCreatedAt: mockGetOrderCreatedAt,
    } as Pick<OrderDbClient, "getOrderReferenceNumber" | "getOrderCreatedAt"> as OrderDbClient,
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
    mockGetOrderCreatedAt.mockResolvedValue("2026-08-05T10:00:00Z");
  });

  describe("OrderConfirmedMessageBuilder", () => {
    it("builds confirmed notify message", async () => {
      const result = await new OrderConfirmedMessageBuilder(deps).build({
        patientId: "patient-1",
        orderId: "order-4",
        correlationId: "corr-4",
      });

      expect(result.eventCode).toBe(NotifyEventCode.OrderConfirmed);
      expect(result.correlationId).toBe("corr-4");
      expect(result.personalisation).toEqual({
        orderedDate: "5 August 2026",
        orderLinkUrl: "https://hometest.example.nhs.uk/orders/order-4/tracking",
        referenceNumber: "100001",
      });
      expect(mockGetOrderCreatedAt).toHaveBeenCalledWith("order-4");
    });
  });

  describe("OrderDispatchedMessageBuilder", () => {
    it("builds dispatched notify message", async () => {
      const result = await new OrderDispatchedMessageBuilder(deps, orderStatusService).build({
        patientId: "patient-1",
        orderId: "order-1",
        correlationId: "corr-1",
      });

      expect(result.eventCode).toBe(NotifyEventCode.OrderDispatched);
      expect(result.correlationId).toBe("corr-1");
      expect(result.personalisation).toEqual({
        dispatchedDate: "6 August 2026",
        orderLinkUrl: "https://hometest.example.nhs.uk/orders/order-1/tracking",
        referenceNumber: "100001",
      });
      expect(mockGetOrderStatusCreatedAt).toHaveBeenCalledWith(
        "order-1",
        OrderStatusCodes.DISPATCHED,
      );
    });
  });

  describe("OrderReceivedMessageBuilder", () => {
    it("builds received notify message", async () => {
      const result = await new OrderReceivedMessageBuilder(deps, orderStatusService).build({
        patientId: "patient-1",
        orderId: "order-2",
        correlationId: "corr-2",
      });

      expect(result.eventCode).toBe(NotifyEventCode.OrderReceived);
      expect(result.correlationId).toBe("corr-2");
      expect(result.personalisation).toEqual({
        receivedDate: "6 August 2026",
        orderLinkUrl: "https://hometest.example.nhs.uk/orders/order-2/tracking",
        referenceNumber: "100001",
      });
      expect(mockGetOrderStatusCreatedAt).toHaveBeenCalledWith(
        "order-2",
        OrderStatusCodes.RECEIVED,
      );
    });
  });

  describe("OrderResultAvailableMessageBuilder", () => {
    it("builds result available notify message", async () => {
      const result = await new OrderResultAvailableMessageBuilder(deps).build({
        patientId: "patient-1",
        orderId: "order-3",
        correlationId: "corr-3",
      });

      expect(result.eventCode).toBe(NotifyEventCode.ResultReady);
      expect(result.correlationId).toBe("corr-3");
      expect(result.personalisation).toEqual({
        orderedDate: "5 August 2026",
        resultLinkUrl: "https://hometest.example.nhs.uk/orders/order-3/results",
        referenceNumber: "100001",
      });
      expect(mockGetOrderCreatedAt).toHaveBeenCalledWith("order-3");
    });
  });
});
