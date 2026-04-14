import { ConsoleCommons } from "../../commons";
import {
  type OrderStatusCode,
  OrderStatusCodes,
  OrderStatusService,
} from "../../db/order-status-db";
import type { NotifyMessageBuilder } from "../message-builders/base-notify-message-builder";
import type { DispatchedReminderMessageBuilderInput } from "../message-builders/reminder/dispatched-reminder-message-builder";
import { BaseNotifyService, type NotifyServiceDependencies } from "./base-notify-service";

const commons = new ConsoleCommons();
const name = "reminder-notify-service";

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
  eventCode: string;
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
      return;
    }

    const patientId = await this.orderStatusService.getPatientIdFromOrder(orderId);

    if (!patientId) {
      commons.logError(name, "Patient not found for reminder notification", {
        correlationId,
        orderId,
      });
      return;
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
