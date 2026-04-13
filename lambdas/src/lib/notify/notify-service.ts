import { ConsoleCommons } from "../commons";
import {
  NotificationAuditDbClient,
  NotificationAuditStatus,
} from "../db/notification-audit-db-client";
import { OrderStatusCode, OrderStatusCodes, OrderStatusService } from "../db/order-status-db";
import { SQSClientInterface } from "../sqs/sqs-client";
import type { NotifyMessage } from "../types/notify-message";
import { NotifyMessageBuilder } from "./notify-message-builder";

const commons = new ConsoleCommons();
const name = "notify-service";

export interface OrderStatusNotifyServiceDependencies {
  notificationAuditDbClient: NotificationAuditDbClient;
  sqsClient: SQSClientInterface;
  notifyMessageBuilder: NotifyMessageBuilder;
  notifyMessagesQueueUrl: string;
}

export interface HandleOrderStatusUpdatedInput {
  orderId: string;
  patientId: string;
  correlationId: string;
  statusCode: OrderStatusCode;
}

interface BuildNotifyMessageInput {
  orderId: string;
  patientId: string;
  correlationId: string;
}

type NotifyMessageBuilderByStatus = Partial<
  Record<OrderStatusCode, (input: BuildNotifyMessageInput) => Promise<NotifyMessage>>
>;

export class OrderStatusNotifyService {
  constructor(private readonly dependencies: OrderStatusNotifyServiceDependencies) {}

  async handleOrderStatusUpdated(
    handleOrderStatusUpdatedInput: HandleOrderStatusUpdatedInput,
  ): Promise<void> {
    const { statusCode } = handleOrderStatusUpdatedInput;
    const { notifyMessageBuilder } = this.dependencies;

    const buildNotifyMessageByStatus: NotifyMessageBuilderByStatus = {
      [OrderStatusCodes.CONFIRMED]: ({ patientId, correlationId, orderId }) =>
        notifyMessageBuilder.buildOrderConfirmedNotifyMessage({
          patientId,
          correlationId,
          orderId,
        }),
      [OrderStatusCodes.DISPATCHED]: ({ patientId, correlationId, orderId }) =>
        notifyMessageBuilder.buildOrderDispatchedNotifyMessage({
          patientId,
          correlationId,
          orderId,
        }),
      [OrderStatusCodes.RECEIVED]: ({ patientId, correlationId, orderId }) =>
        notifyMessageBuilder.buildOrderReceivedNotifyMessage({
          patientId,
          correlationId,
          orderId,
        }),
      [OrderStatusCodes.COMPLETE]: ({ patientId, correlationId, orderId }) =>
        notifyMessageBuilder.buildOrderResultAvailableNotifyMessage({
          patientId,
          correlationId,
          orderId,
        }),
    };

    const buildNotifyMessageFunc = buildNotifyMessageByStatus[statusCode];

    if (!buildNotifyMessageFunc) {
      return;
    }

    await this.handleStatusUpdated(handleOrderStatusUpdatedInput, buildNotifyMessageFunc);
  }

  private async handleStatusUpdated(
    input: HandleOrderStatusUpdatedInput,
    buildNotifyMessage: (input: BuildNotifyMessageInput) => Promise<NotifyMessage>,
  ): Promise<void> {
    const { orderId, patientId, correlationId, statusCode } = input;
    const { notificationAuditDbClient, sqsClient, notifyMessagesQueueUrl } = this.dependencies;

    try {
      const notifyMessage = await buildNotifyMessage({
        patientId,
        correlationId,
        orderId,
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
