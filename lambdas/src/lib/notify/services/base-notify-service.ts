import { ConsoleCommons } from "../../commons";
import {
  NotificationAuditDbClient,
  NotificationAuditStatus,
} from "../../db/notification-audit-db-client";
import { SQSClientInterface } from "../../sqs/sqs-client";
import { type NotifyMessage } from "../../types/notify-message";

const commons = new ConsoleCommons();
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

    try {
      const sqsResult = await sqsClient.sendMessage(
        notifyMessagesQueueUrl,
        JSON.stringify(notifyMessage),
      );

      await notificationAuditDbClient.insertNotificationAuditEntry({
        messageReference: notifyMessage.messageReference,
        eventCode: notifyMessage.eventCode,
        correlationId,
        status: NotificationAuditStatus.QUEUED,
      });

      commons.logInfo(name, "Notification dispatched", {
        correlationId,
        orderId,
        eventCode: notifyMessage.eventCode,
        messageId: sqsResult.messageId,
        messageReference: notifyMessage.messageReference,
      });
    } catch (error) {
      commons.logError(name, "Failed to dispatch notification", {
        correlationId,
        orderId,
        eventCode: notifyMessage.eventCode,
        error,
      });
    }
  }
}
