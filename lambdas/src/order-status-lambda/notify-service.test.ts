import { NotificationAuditStatus } from "../lib/db/notification-audit-db-client";
import { OrderStatusCodes, OrderStatusUpdateParams } from "../lib/db/order-status-db";
import { NotifyEventCode } from "../lib/types/notify-message";
import { OrderStatusNotifyService } from "./notify-service";

describe("OrderStatusNotifyService", () => {
  const mockIsFirstStatusOccurrence = jest.fn<Promise<boolean>, [string, string]>();
  const mockBuildOrderDispatchedNotifyMessage = jest.fn();
  const mockBuildOrderReceivedNotifyMessage = jest.fn();
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

    mockIsFirstStatusOccurrence.mockResolvedValue(true);
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
    mockSendMessage.mockResolvedValue({ messageId: "message-id" });
    mockInsertNotificationAuditEntry.mockResolvedValue(undefined);

    service = new OrderStatusNotifyService({
      orderStatusDb: {
        isFirstStatusOccurrence: mockIsFirstStatusOccurrence,
      } as never,
      notificationAuditDbClient: {
        insertNotificationAuditEntry: mockInsertNotificationAuditEntry,
      } as never,
      sqsClient: {
        sendMessage: mockSendMessage,
      },
      notifyMessageBuilder: {
        buildOrderDispatchedNotifyMessage: mockBuildOrderDispatchedNotifyMessage,
        buildOrderReceivedNotifyMessage: mockBuildOrderReceivedNotifyMessage,
      } as never,
      notifyMessagesQueueUrl: "https://example.queue.local/notify",
    });
  });

  it("should do nothing for statuses without side effects", async () => {
    await service.handleOrderStatusUpdated({
      orderId: statusUpdate.orderId,
      patientId: "patient-123",
      correlationId: statusUpdate.correlationId,
      statusUpdate: {
        ...statusUpdate,
        statusCode: OrderStatusCodes.COMPLETE,
      },
    });

    expect(mockIsFirstStatusOccurrence).not.toHaveBeenCalled();
    expect(mockBuildOrderDispatchedNotifyMessage).not.toHaveBeenCalled();
    expect(mockBuildOrderReceivedNotifyMessage).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockInsertNotificationAuditEntry).not.toHaveBeenCalled();
  });

  it("should not send a dispatched notification when it is not the first occurrence", async () => {
    mockIsFirstStatusOccurrence.mockResolvedValueOnce(false);

    await service.handleOrderStatusUpdated({
      orderId: statusUpdate.orderId,
      patientId: "patient-123",
      correlationId: statusUpdate.correlationId,
      statusUpdate,
    });

    expect(mockIsFirstStatusOccurrence).toHaveBeenCalledWith(
      statusUpdate.orderId,
      OrderStatusCodes.DISPATCHED,
    );
    expect(mockBuildOrderDispatchedNotifyMessage).not.toHaveBeenCalled();
    expect(mockBuildOrderReceivedNotifyMessage).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockInsertNotificationAuditEntry).not.toHaveBeenCalled();
  });

  it("should send and audit the first dispatched notification", async () => {
    await service.handleOrderStatusUpdated({
      orderId: statusUpdate.orderId,
      patientId: "patient-123",
      correlationId: statusUpdate.correlationId,
      statusUpdate,
    });

    expect(mockBuildOrderDispatchedNotifyMessage).toHaveBeenCalledWith({
      patientId: "patient-123",
      correlationId: statusUpdate.correlationId,
      orderId: statusUpdate.orderId,
      dispatchedAt: statusUpdate.createdAt,
    });
    expect(mockSendMessage).toHaveBeenCalledWith(
      "https://example.queue.local/notify",
      expect.any(String),
    );
    expect(mockInsertNotificationAuditEntry).toHaveBeenCalledWith({
      messageReference: "123e4567-e89b-12d3-a456-426614174099",
      eventCode: NotifyEventCode.OrderDispatched,
      correlationId: statusUpdate.correlationId,
      status: NotificationAuditStatus.QUEUED,
    });
  });

  it("should not send a received notification when it is not the first occurrence", async () => {
    mockIsFirstStatusOccurrence.mockResolvedValueOnce(false);

    await service.handleOrderStatusUpdated({
      orderId: statusUpdate.orderId,
      patientId: "patient-123",
      correlationId: statusUpdate.correlationId,
      statusUpdate: {
        ...statusUpdate,
        statusCode: OrderStatusCodes.RECEIVED,
      },
    });

    expect(mockIsFirstStatusOccurrence).toHaveBeenCalledWith(
      statusUpdate.orderId,
      OrderStatusCodes.RECEIVED,
    );
    expect(mockBuildOrderReceivedNotifyMessage).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockInsertNotificationAuditEntry).not.toHaveBeenCalled();
  });

  it("should send and audit the first received notification", async () => {
    await service.handleOrderStatusUpdated({
      orderId: statusUpdate.orderId,
      patientId: "patient-123",
      correlationId: statusUpdate.correlationId,
      statusUpdate: {
        ...statusUpdate,
        statusCode: OrderStatusCodes.RECEIVED,
      },
    });

    expect(mockBuildOrderReceivedNotifyMessage).toHaveBeenCalledWith({
      patientId: "patient-123",
      correlationId: statusUpdate.correlationId,
      orderId: statusUpdate.orderId,
      receivedAt: statusUpdate.createdAt,
    });
    expect(mockSendMessage).toHaveBeenCalledWith(
      "https://example.queue.local/notify",
      expect.any(String),
    );
    expect(mockInsertNotificationAuditEntry).toHaveBeenCalledWith({
      messageReference: "123e4567-e89b-12d3-a456-426614174199",
      eventCode: NotifyEventCode.OrderReceived,
      correlationId: statusUpdate.correlationId,
      status: NotificationAuditStatus.QUEUED,
    });
  });

  it("should swallow errors when building the notify message fails", async () => {
    mockBuildOrderDispatchedNotifyMessage.mockRejectedValueOnce(
      new Error("Notify payload build failed"),
    );

    await expect(
      service.handleOrderStatusUpdated({
        orderId: statusUpdate.orderId,
        patientId: "patient-123",
        correlationId: statusUpdate.correlationId,
        statusUpdate,
      }),
    ).resolves.toBeUndefined();

    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockInsertNotificationAuditEntry).not.toHaveBeenCalled();
  });

  it("should swallow errors when sending the notify message fails", async () => {
    mockSendMessage.mockRejectedValueOnce(new Error("SQS unavailable"));

    await expect(
      service.handleOrderStatusUpdated({
        orderId: statusUpdate.orderId,
        patientId: "patient-123",
        correlationId: statusUpdate.correlationId,
        statusUpdate,
      }),
    ).resolves.toBeUndefined();

    expect(mockInsertNotificationAuditEntry).not.toHaveBeenCalled();
  });

  it("should swallow errors when building the received notify message fails", async () => {
    mockBuildOrderReceivedNotifyMessage.mockRejectedValueOnce(
      new Error("Notify payload build failed"),
    );

    await expect(
      service.handleOrderStatusUpdated({
        orderId: statusUpdate.orderId,
        patientId: "patient-123",
        correlationId: statusUpdate.correlationId,
        statusUpdate: {
          ...statusUpdate,
          statusCode: OrderStatusCodes.RECEIVED,
        },
      }),
    ).resolves.toBeUndefined();

    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockInsertNotificationAuditEntry).not.toHaveBeenCalled();
  });
});
