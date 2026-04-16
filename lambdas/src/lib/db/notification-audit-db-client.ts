import { type NotifyEventCode } from "../types/notify-message";
import { type DBClient } from "./db-client";

export enum NotificationAuditStatus {
  QUEUED = "QUEUED",
  SENT = "SENT",
  FAILED = "FAILED",
}

export interface NotificationAuditEntryParams {
  messageReference: string;
  eventCode: NotifyEventCode;
  correlationId: string;
  status: NotificationAuditStatus;
  notifyMessageId?: string | null;
  routingPlanId?: string | null;
}

export class NotificationAuditDbClient {
  constructor(private readonly dbClient: DBClient) {}

  async insertNotificationAuditEntry(params: NotificationAuditEntryParams): Promise<void> {
    const {
      messageReference,
      notifyMessageId = null,
      eventCode,
      routingPlanId = null,
      correlationId,
      status,
    } = params;

    const query = `
      INSERT INTO notification_audit (
        message_reference,
        notify_message_id,
        event_code,
        routing_plan_id,
        correlation_id,
        status
      )
      VALUES ($1::uuid, $2, $3, $4::uuid, $5::uuid, $6)
    `;

    try {
      const result = await this.dbClient.query(query, [
        messageReference,
        notifyMessageId,
        eventCode,
        routingPlanId,
        correlationId,
        status,
      ]);

      if (result.rowCount === 0) {
        throw new Error("Failed to insert notification audit entry");
      }
    } catch (error) {
      throw new Error(
        `Failed to insert notification audit entry for messageReference ${messageReference}`,
        {
          cause: error,
        },
      );
    }
  }
}
