import { ConsoleCommons } from "../lib/commons";
import {
  NotificationAuditDbClient,
  NotificationAuditStatus,
} from "../lib/db/notification-audit-db-client";
import {
  OrderStatusCodes,
  OrderStatusService,
  OrderStatusUpdateParams,
} from "../lib/db/order-status-db";
import { SQSClientInterface } from "../lib/sqs/sqs-client";
import { NotifyMessageBuilder } from "./notify-message-builder";

const commons = new ConsoleCommons();
const name = "order-status-lambda";

export interface OrderStatusNotifyServiceDependencies {
  orderStatusDb: OrderStatusService;
  notificationAuditDbClient: NotificationAuditDbClient;
  sqsClient: SQSClientInterface;
  notifyMessageBuilder: NotifyMessageBuilder;
  notifyMessagesQueueUrl: string;
}

export interface HandleOrderStatusUpdatedInput {
  orderId: string;
  patientId: string;
  correlationId: string;
  statusUpdate: OrderStatusUpdateParams;
}

export class OrderStatusNotifyService {
  constructor(private readonly dependencies: OrderStatusNotifyServiceDependencies) {}

  async handleOrderStatusUpdated(input: HandleOrderStatusUpdatedInput): Promise<void> {
    const { statusUpdate } = input;

    switch (statusUpdate.statusCode) {
      case OrderStatusCodes.DISPATCHED:
        await this.handleDispatchedStatusUpdated(input);
        return;
      default:
        return;
    }
  }

  private async handleDispatchedStatusUpdated(input: HandleOrderStatusUpdatedInput): Promise<void> {
    const { orderId, patientId, correlationId, statusUpdate } = input;
    const {
      orderStatusDb,
      notificationAuditDbClient,
      sqsClient,
      notifyMessageBuilder,
      notifyMessagesQueueUrl,
    } = this.dependencies;

    try {
      const isFirstDispatched = await orderStatusDb.isFirstStatusOccurrence(
        orderId,
        OrderStatusCodes.DISPATCHED,
      );

      if (!isFirstDispatched) {
        return;
      }

      const notifyMessage = await notifyMessageBuilder.buildOrderDispatchedNotifyMessage({
        patientId,
        correlationId,
        orderId,
        dispatchedAt: statusUpdate.createdAt,
      });

      await sqsClient.sendMessage(notifyMessagesQueueUrl, JSON.stringify(notifyMessage));

      await notificationAuditDbClient.insertNotificationAuditEntry({
        messageReference: notifyMessage.messageReference,
        eventCode: notifyMessage.eventCode,
        correlationId,
        status: NotificationAuditStatus.QUEUED,
      });
    } catch (error) {
      commons.logError(name, "Failed to send dispatched notification", {
        correlationId,
        orderId,
        error,
      });
    }
  }
}
