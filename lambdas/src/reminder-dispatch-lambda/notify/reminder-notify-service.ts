import { type OrderStatusCode, OrderStatusService } from "../../lib/db/order-status-db";
import type { NotifyMessageBuilder } from "../../lib/notify/message-builders/base-notify-message-builder";
import {
  BaseNotifyService,
  type NotifyServiceDependencies,
} from "../../lib/notify/services/base-notify-service";
import { NotifyEventCode } from "../../lib/types/notify-message";
import type { DispatchedReminderMessageBuilderInput } from "./dispatched-reminder-message-builder";

export interface ReminderNotifyServiceDependencies extends NotifyServiceDependencies {
  notifyMessageBuilders: Partial<
    Record<OrderStatusCode, NotifyMessageBuilder<DispatchedReminderMessageBuilderInput>>
  >;
  orderStatusService: Pick<OrderStatusService, "getPatientIdFromOrder">;
}

export interface ReminderNotifyInput {
  reminderId: string;
  orderId: string;
  correlationId: string;
  statusCode: OrderStatusCode;
  eventCode: NotifyEventCode;
}

export class ReminderNotifyService extends BaseNotifyService {
  private readonly notifyMessageBuilders: Partial<
    Record<OrderStatusCode, NotifyMessageBuilder<DispatchedReminderMessageBuilderInput>>
  >;
  private readonly orderStatusService: Pick<OrderStatusService, "getPatientIdFromOrder">;

  constructor(deps: ReminderNotifyServiceDependencies) {
    super(deps);
    this.notifyMessageBuilders = deps.notifyMessageBuilders;
    this.orderStatusService = deps.orderStatusService;
  }

  async dispatch(input: ReminderNotifyInput): Promise<void> {
    const { reminderId, orderId, correlationId, statusCode, eventCode } = input;

    const notifyMessageBuilder = this.notifyMessageBuilders[statusCode];
    if (!notifyMessageBuilder) {
      throw new Error(`No message builder registered for status code: ${statusCode}`);
    }

    const patientId = await this.orderStatusService.getPatientIdFromOrder(orderId);

    if (!patientId) {
      throw new Error(`Patient not found for orderId ${orderId}`);
    }

    const notifyMessage = await notifyMessageBuilder.build({
      reminderId,
      patientId,
      orderId,
      correlationId,
      eventCode,
    });

    await this.dispatchNotification(notifyMessage, orderId);
  }
}
