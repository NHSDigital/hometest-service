import { ConsoleCommons } from "../lib/commons";
import {
  NotificationAuditDbClient,
  NotificationAuditStatus,
} from "../lib/db/notification-audit-db-client";
import {
  OrderStatusCode,
  OrderStatusCodes,
  OrderStatusService,
  OrderStatusUpdateParams,
} from "../lib/db/order-status-db";
import { SQSClientInterface } from "../lib/sqs/sqs-client";
import type { NotifyMessage } from "../lib/types/notify-message";
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

interface BuildNotifyMessageInput {
  orderId: string;
  patientId: string;
  correlationId: string;
  createdAt: string;
}

type NotifyMessageBuilderByStatus = Partial<
  Record<OrderStatusCode, (input: BuildNotifyMessageInput) => Promise<NotifyMessage>>
>;

export class OrderStatusNotifyService {
  constructor(private readonly dependencies: OrderStatusNotifyServiceDependencies) {}

  async handleOrderStatusUpdated(
    handleOrderStatusUpdatedInput: HandleOrderStatusUpdatedInput,
  ): Promise<void> {
    const { statusUpdate } = handleOrderStatusUpdatedInput;
    const { notifyMessageBuilder } = this.dependencies;

    const buildNotifyMessageByStatus: NotifyMessageBuilderByStatus = {
      [OrderStatusCodes.DISPATCHED]: ({ patientId, correlationId, orderId, createdAt }) =>
        notifyMessageBuilder.buildOrderDispatchedNotifyMessage({
          patientId,
          correlationId,
          orderId,
          dispatchedAt: createdAt,
        }),
      [OrderStatusCodes.RECEIVED]: ({ patientId, correlationId, orderId, createdAt }) =>
        notifyMessageBuilder.buildOrderReceivedNotifyMessage({
          patientId,
          correlationId,
          orderId,
          receivedAt: createdAt,
        }),
    };

    const buildNotifyMessageFunc = buildNotifyMessageByStatus[statusUpdate.statusCode];

    if (!buildNotifyMessageFunc) {
      return;
    }

    await this.handleStatusUpdated(handleOrderStatusUpdatedInput, buildNotifyMessageFunc);
  }

  private async handleStatusUpdated(
    input: HandleOrderStatusUpdatedInput,
    buildNotifyMessage: (input: BuildNotifyMessageInput) => Promise<NotifyMessage>,
  ): Promise<void> {
    const { orderId, patientId, correlationId, statusUpdate } = input;
    const { statusCode } = statusUpdate;
    const { orderStatusDb, notificationAuditDbClient, sqsClient, notifyMessagesQueueUrl } =
      this.dependencies;

    const isFirstOccurrence = await orderStatusDb.isFirstStatusOccurrence(orderId, statusCode);

    if (!isFirstOccurrence) {
      return;
    }

    try {
      const notifyMessage = await buildNotifyMessage({
        patientId,
        correlationId,
        orderId,
        createdAt: statusUpdate.createdAt,
      });

      await sqsClient.sendMessage(notifyMessagesQueueUrl, JSON.stringify(notifyMessage));

      await notificationAuditDbClient.insertNotificationAuditEntry({
        messageReference: notifyMessage.messageReference,
        eventCode: notifyMessage.eventCode,
        correlationId,
        status: NotificationAuditStatus.QUEUED,
      });
    } catch (error) {
      commons.logError(name, "Failed to send status notification", {
        correlationId,
        orderId,
        statusCode,
        error,
      });
    }
  }
}
