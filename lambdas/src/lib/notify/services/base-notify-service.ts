import {
  NotificationAuditDbClient,
  NotificationAuditStatus,
} from "../../db/notification-audit-db-client";
import { SQSClientInterface } from "../../sqs/sqs-client";
import { type NotifyMessage } from "../../types/notify-message";

const name = "notify-service";

export interface NotifyServiceDependencies {
  notificationAuditDbClient: NotificationAuditDbClient;
  sqsClient: SQSClientInterface;
  notifyMessagesQueueUrl: string;
}

export abstract class BaseNotifyService {
  constructor(protected readonly dependencies: NotifyServiceDependencies) {}

  protected async dispatchNotification(
    notifyMessage: NotifyMessage,
    orderId: string,
  ): Promise<void> {
    const { correlationId } = notifyMessage;
    const { notificationAuditDbClient, sqsClient, notifyMessagesQueueUrl } = this.dependencies;

    let sqsMessageId: string | undefined;

    try {
      const sqsResult = await sqsClient.sendMessage(
        notifyMessagesQueueUrl,
        JSON.stringify(notifyMessage),
      );
      sqsMessageId = sqsResult.messageId;

      await notificationAuditDbClient.insertNotificationAuditEntry({
        messageReference: notifyMessage.messageReference,
        eventCode: notifyMessage.eventCode,
        correlationId,
        status: NotificationAuditStatus.QUEUED,
      });

      console.info(name, "Notification dispatched", {
        correlationId,
        orderId,
        eventCode: notifyMessage.eventCode,
        sqsMessageId,
        messageReference: notifyMessage.messageReference,
      });
    } catch (error) {
      console.error(name, "Failed to dispatch notification", {
        correlationId,
        orderId,
        eventCode: notifyMessage.eventCode,
        messageReference: notifyMessage.messageReference,
        sqsMessageId,
        error,
      });
      throw error;
    }
  }
}
