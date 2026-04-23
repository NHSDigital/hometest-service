import { NotificationAuditStatus } from "../../db/notification-audit-db-client";
import { OrderStatusCodes, OrderStatusUpdateParams } from "../../db/order-status-db";
import { NotifyEventCode } from "../../types/notify-message";
import { OrderStatusNotifyService } from "./order-status-notify-service";

describe("OrderStatusNotifyService", () => {
  const mockBuildOrderConfirmedNotifyMessage = jest.fn();
  const mockBuildOrderDispatchedNotifyMessage = jest.fn();
  const mockBuildOrderReceivedNotifyMessage = jest.fn();
  const mockBuildOrderResultAvailableNotifyMessage = jest.fn();
  const mockSendMessage = jest.fn();
  const mockInsertNotificationAuditEntry = jest.fn();

  const statusUpdate: OrderStatusUpdateParams = {
    orderId: "550e8400-e29b-41d4-a716-446655440000",
    statusCode: OrderStatusCodes.DISPATCHED,
    createdAt: "2024-01-15T10:00:00Z",
    correlationId: "123e4567-e89b-12d3-a456-426614174000",
  };

  let service: OrderStatusNotifyService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBuildOrderConfirmedNotifyMessage.mockResolvedValue({
      messageReference: "123e4567-e89b-12d3-a456-426614174089",
      eventCode: NotifyEventCode.OrderConfirmed,
      correlationId: statusUpdate.correlationId,
      recipient: {
        nhsNumber: "1234567890",
        dateOfBirth: "1990-01-02",
      },
      personalisation: {},
    });
    mockBuildOrderDispatchedNotifyMessage.mockResolvedValue({
      messageReference: "123e4567-e89b-12d3-a456-426614174099",
      eventCode: NotifyEventCode.OrderDispatched,
      correlationId: statusUpdate.correlationId,
      recipient: {
        nhsNumber: "1234567890",
        dateOfBirth: "1990-01-02",
      },
      personalisation: {},
    });
    mockBuildOrderReceivedNotifyMessage.mockResolvedValue({
      messageReference: "123e4567-e89b-12d3-a456-426614174199",
      eventCode: NotifyEventCode.OrderReceived,
      correlationId: statusUpdate.correlationId,
      recipient: {
        nhsNumber: "1234567890",
        dateOfBirth: "1990-01-02",
      },
      personalisation: {},
    });
    mockBuildOrderResultAvailableNotifyMessage.mockResolvedValue({
      messageReference: "123e4567-e89b-12d3-a456-426614174299",
      eventCode: NotifyEventCode.ResultReady,
      correlationId: statusUpdate.correlationId,
      recipient: {
        nhsNumber: "1234567890",
        dateOfBirth: "1990-01-02",
      },
      personalisation: {},
    });
    mockSendMessage.mockResolvedValue({ messageId: "message-id" });
    mockInsertNotificationAuditEntry.mockResolvedValue(undefined);

    service = new OrderStatusNotifyService({
      notifyMessageBuilders: {
        [OrderStatusCodes.CONFIRMED]: { build: mockBuildOrderConfirmedNotifyMessage },
        [OrderStatusCodes.DISPATCHED]: { build: mockBuildOrderDispatchedNotifyMessage },
        [OrderStatusCodes.RECEIVED]: { build: mockBuildOrderReceivedNotifyMessage },
        [OrderStatusCodes.COMPLETE]: { build: mockBuildOrderResultAvailableNotifyMessage },
      },
      notificationAuditDbClient: {
        insertNotificationAuditEntry: mockInsertNotificationAuditEntry,
      } as never,
      sqsClient: {
        sendMessage: mockSendMessage,
      },
      notifyMessagesQueueUrl: "https://example.queue.local/notify",
    });
  });

  it("should do nothing for statuses without side effects", async () => {
    await service.dispatch({
      orderId: statusUpdate.orderId,
      patientId: "patient-123",
      correlationId: statusUpdate.correlationId,
      statusCode: OrderStatusCodes.SUBMITTED,
    });

    expect(mockBuildOrderConfirmedNotifyMessage).not.toHaveBeenCalled();
    expect(mockBuildOrderDispatchedNotifyMessage).not.toHaveBeenCalled();
    expect(mockBuildOrderReceivedNotifyMessage).not.toHaveBeenCalled();
    expect(mockBuildOrderResultAvailableNotifyMessage).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockInsertNotificationAuditEntry).not.toHaveBeenCalled();
  });

  it("should send and audit an order confirmed notification", async () => {
    await service.dispatch({
      orderId: statusUpdate.orderId,
      patientId: "patient-123",
      correlationId: statusUpdate.correlationId,
      statusCode: OrderStatusCodes.CONFIRMED,
    });

    expect(mockBuildOrderConfirmedNotifyMessage).toHaveBeenCalledWith({
      patientId: "patient-123",
      correlationId: statusUpdate.correlationId,
      orderId: statusUpdate.orderId,
    });
    expect(mockSendMessage).toHaveBeenCalledWith(
      "https://example.queue.local/notify",
      expect.any(String),
    );
    expect(mockInsertNotificationAuditEntry).toHaveBeenCalledWith({
      messageReference: "123e4567-e89b-12d3-a456-426614174089",
      eventCode: NotifyEventCode.OrderConfirmed,
      correlationId: statusUpdate.correlationId,
      status: NotificationAuditStatus.QUEUED,
    });
  });

  it("should send and audit an order confirmed notification", async () => {
    await service.dispatch({
      orderId: statusUpdate.orderId,
      patientId: "patient-123",
      correlationId: statusUpdate.correlationId,
      statusCode: OrderStatusCodes.CONFIRMED,
    });

    expect(mockBuildOrderConfirmedNotifyMessage).toHaveBeenCalledWith({
      patientId: "patient-123",
      correlationId: statusUpdate.correlationId,
      orderId: statusUpdate.orderId,
    });
    expect(mockSendMessage).toHaveBeenCalledWith(
      "https://example.queue.local/notify",
      expect.any(String),
    );
    expect(mockInsertNotificationAuditEntry).toHaveBeenCalledWith({
      messageReference: "123e4567-e89b-12d3-a456-426614174089",
      eventCode: NotifyEventCode.OrderConfirmed,
      correlationId: statusUpdate.correlationId,
      status: NotificationAuditStatus.QUEUED,
    });
  });

  it("should propagate errors when building the notify message fails", async () => {
    mockBuildOrderDispatchedNotifyMessage.mockRejectedValueOnce(
      new Error("Notify payload build failed"),
    );

    await expect(
      service.dispatch({
        orderId: statusUpdate.orderId,
        patientId: "patient-123",
        correlationId: statusUpdate.correlationId,
        statusCode: OrderStatusCodes.DISPATCHED,
      }),
    ).rejects.toThrow("Notify payload build failed");

    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockInsertNotificationAuditEntry).not.toHaveBeenCalled();
  });

  it("should propagate errors when sending the notify message fails", async () => {
    mockSendMessage.mockRejectedValueOnce(new Error("SQS unavailable"));

    await expect(
      service.dispatch({
        orderId: statusUpdate.orderId,
        patientId: "patient-123",
        correlationId: statusUpdate.correlationId,
        statusCode: OrderStatusCodes.DISPATCHED,
      }),
    ).rejects.toThrow("SQS unavailable");

    expect(mockInsertNotificationAuditEntry).not.toHaveBeenCalled();
  });
});
