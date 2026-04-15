import { NotificationAuditStatus } from "../../db/notification-audit-db-client";
import { OrderStatusCodes } from "../../db/order-status-db";
import { NotifyEventCode } from "../../types/notify-message";
import {
  ReminderNotifyService,
  type ReminderNotifyServiceDependencies,
} from "./reminder-notify-service";

describe("ReminderNotifyService", () => {
  const mockGetPatientIdFromOrder = jest.fn();
  const mockBuildDispatchedReminderMessage = jest.fn();
  const mockSendMessage = jest.fn();
  const mockInsertNotificationAuditEntry = jest.fn();

  const orderId = "550e8400-e29b-41d4-a716-446655440000";
  const correlationId = "123e4567-e89b-12d3-a456-426614174000";
  const reminderId = "223e4567-e89b-12d3-a456-426614174444";

  let service: ReminderNotifyService;

  const buildService = (deps?: Partial<ReminderNotifyServiceDependencies>): ReminderNotifyService =>
    new ReminderNotifyService({
      notifyMessageBuilders: {
        [OrderStatusCodes.DISPATCHED]: { build: mockBuildDispatchedReminderMessage },
      },
      orderStatusService: { getPatientIdFromOrder: mockGetPatientIdFromOrder },
      notificationAuditDbClient: {
        insertNotificationAuditEntry: mockInsertNotificationAuditEntry,
      } as never,
      sqsClient: { sendMessage: mockSendMessage },
      notifyMessagesQueueUrl: "https://example.queue.local/notify",
      ...deps,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPatientIdFromOrder.mockResolvedValue("patient-123");
    mockBuildDispatchedReminderMessage.mockResolvedValue({
      messageReference: reminderId,
      eventCode: "DISPATCHED_INITIAL_REMINDER",
      correlationId,
      recipient: { nhsNumber: "1234567890", dateOfBirth: "1990-01-02" },
      personalisation: {},
    });
    mockSendMessage.mockResolvedValue({ messageId: "sqs-message-id" });
    mockInsertNotificationAuditEntry.mockResolvedValue(undefined);

    service = buildService();
  });

  it("dispatches and audits a reminder notification for a dispatched order", async () => {
    await service.dispatch({
      reminderId,
      orderId,
      correlationId,
      statusCode: OrderStatusCodes.DISPATCHED,
      eventCode: NotifyEventCode.DispatchedInitialReminder,
    });

    expect(mockBuildDispatchedReminderMessage).toHaveBeenCalledWith({
      reminderId,
      patientId: "patient-123",
      correlationId,
      orderId,
      eventCode: NotifyEventCode.DispatchedInitialReminder,
    });
    expect(mockSendMessage).toHaveBeenCalledWith(
      "https://example.queue.local/notify",
      expect.any(String),
    );
    expect(mockInsertNotificationAuditEntry).toHaveBeenCalledWith({
      messageReference: reminderId,
      eventCode: "DISPATCHED_INITIAL_REMINDER",
      correlationId,
      status: NotificationAuditStatus.QUEUED,
    });
  });

  it("does nothing for a status code with no strategy", async () => {
    await service.dispatch({
      reminderId,
      orderId,
      correlationId,
      statusCode: OrderStatusCodes.SUBMITTED,
      eventCode: NotifyEventCode.DispatchedInitialReminder,
    });

    expect(mockGetPatientIdFromOrder).not.toHaveBeenCalled();
    expect(mockBuildDispatchedReminderMessage).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockInsertNotificationAuditEntry).not.toHaveBeenCalled();
  });

  it("throws when patient is not found", async () => {
    mockGetPatientIdFromOrder.mockResolvedValueOnce(null);

    await expect(
      service.dispatch({
        reminderId,
        orderId,
        correlationId,
        statusCode: OrderStatusCodes.DISPATCHED,
        eventCode: NotifyEventCode.DispatchedSecondReminder,
      }),
    ).rejects.toThrow(`Patient not found for orderId ${orderId}`);

    expect(mockBuildDispatchedReminderMessage).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockInsertNotificationAuditEntry).not.toHaveBeenCalled();
  });

  it("propagates errors when building the reminder notify message fails", async () => {
    mockBuildDispatchedReminderMessage.mockRejectedValueOnce(new Error("builder failed"));

    await expect(
      service.dispatch({
        reminderId,
        orderId,
        correlationId,
        statusCode: OrderStatusCodes.DISPATCHED,
        eventCode: NotifyEventCode.DispatchedInitialReminder,
      }),
    ).rejects.toThrow("builder failed");

    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockInsertNotificationAuditEntry).not.toHaveBeenCalled();
  });
});
