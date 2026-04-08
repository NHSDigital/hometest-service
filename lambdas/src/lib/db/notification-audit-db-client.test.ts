import { NotifyEventCode } from "../types/notify-message";
import { type DBClient } from "./db-client";
import {
  NotificationAuditDbClient,
  type NotificationAuditEntryParams,
  NotificationAuditStatus,
} from "./notification-audit-db-client";

const mockQuery = jest.fn();

describe("NotificationAuditDbClient", () => {
  let client: NotificationAuditDbClient;

  beforeEach(() => {
    jest.clearAllMocks();

    const dbClient: DBClient = {
      query: mockQuery,
      withTransaction: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    client = new NotificationAuditDbClient(dbClient);
  });

  it("should insert notification audit entry", async () => {
    const params: NotificationAuditEntryParams = {
      messageReference: "123e4567-e89b-12d3-a456-426614174000",
      eventCode: NotifyEventCode.OrderDispatched,
      correlationId: "123e4567-e89b-12d3-a456-426614174001",
      status: NotificationAuditStatus.SENT,
    };

    mockQuery.mockResolvedValue({
      rows: [],
      rowCount: 1,
    });

    await expect(client.insertNotificationAuditEntry(params)).resolves.toBeUndefined();

    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("notification_audit"), [
      params.messageReference,
      null,
      params.eventCode,
      null,
      params.correlationId,
      params.status,
    ]);
  });

  it("should throw when notification audit insert affects no rows", async () => {
    mockQuery.mockResolvedValue({
      rows: [],
      rowCount: 0,
    });

    await expect(
      client.insertNotificationAuditEntry({
        messageReference: "123e4567-e89b-12d3-a456-426614174000",
        eventCode: NotifyEventCode.OrderDispatched,
        correlationId: "123e4567-e89b-12d3-a456-426614174001",
        status: NotificationAuditStatus.SENT,
      }),
    ).rejects.toThrow("Failed to insert notification audit entry");
  });
});
