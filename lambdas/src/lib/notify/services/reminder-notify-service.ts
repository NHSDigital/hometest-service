import { ConsoleCommons } from "../../commons";
import {
  type OrderStatusCode,
  OrderStatusCodes,
  OrderStatusService,
} from "../../db/order-status-db";
import { type NotifyMessageBuilderDependencies } from "../message-builders/base-notify-message-builder";
import { DispatchedReminderMessageBuilder } from "../message-builders/dispatched-reminder-message-builder";
import { BaseNotifyService, type NotifyServiceDependencies } from "./base-notify-service";

const commons = new ConsoleCommons();
const name = "reminder-notify-service";

export interface ReminderNotifyServiceDependencies extends NotifyServiceDependencies {
  builderDeps: NotifyMessageBuilderDependencies;
  orderStatusService: OrderStatusService;
}

export interface ReminderNotifyInput {
  reminderId: string;
  orderId: string;
  correlationId: string;
  statusCode: OrderStatusCode;
  eventCode: string;
}

export class ReminderNotifyService extends BaseNotifyService {
  constructor(private readonly reminderDeps: ReminderNotifyServiceDependencies) {
    super(reminderDeps);
  }

  async dispatch(input: ReminderNotifyInput): Promise<void> {
    const { reminderId, orderId, correlationId, statusCode, eventCode } = input;
    const { builderDeps, orderStatusService } = this.reminderDeps;

    if (statusCode !== OrderStatusCodes.DISPATCHED) {
      return;
    }

    const patientId = await orderStatusService.getPatientIdFromOrder(orderId);

    if (!patientId) {
      commons.logError(name, "Patient not found for reminder notification", {
        correlationId,
        orderId,
      });
      return;
    }

    const builder = new DispatchedReminderMessageBuilder(builderDeps, orderStatusService);
    const notifyMessage = await builder.build({
      reminderId,
      patientId,
      orderId,
      correlationId,
      eventCode,
    });

    await this.dispatchNotification(notifyMessage, orderId);
  }
}
