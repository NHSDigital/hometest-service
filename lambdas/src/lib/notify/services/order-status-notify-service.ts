import {
  type OrderStatusCode,
  OrderStatusCodes,
  OrderStatusService,
} from "../../db/order-status-db";
import { type NotifyMessage } from "../../types/notify-message";
import { type NotifyMessageBuilderDependencies } from "../message-builders/base-notify-message-builder";
import { OrderDispatchedMessageBuilder } from "../message-builders/order-dispatched-message-builder";
import { OrderReceivedMessageBuilder } from "../message-builders/order-received-message-builder";
import { OrderResultAvailableMessageBuilder } from "../message-builders/order-result-available-message-builder";
import { BaseNotifyService, type NotifyServiceDependencies } from "./base-notify-service";

export interface OrderStatusNotifyServiceDependencies extends NotifyServiceDependencies {
  builderDeps: NotifyMessageBuilderDependencies;
  orderStatusService: OrderStatusService;
}

export interface OrderStatusNotifyInput {
  orderId: string;
  patientId: string;
  correlationId: string;
  statusCode: OrderStatusCode;
}

export class OrderStatusNotifyService extends BaseNotifyService {
  constructor(private readonly orderStatusDeps: OrderStatusNotifyServiceDependencies) {
    super(orderStatusDeps);
  }

  async dispatch(input: OrderStatusNotifyInput): Promise<void> {
    const { statusCode, orderId, patientId, correlationId } = input;
    const { builderDeps, orderStatusService } = this.orderStatusDeps;

    const builderInput = { orderId, patientId, correlationId };

    let builder: { build: (input: typeof builderInput) => Promise<NotifyMessage> };
    switch (statusCode) {
      case OrderStatusCodes.DISPATCHED:
        builder = new OrderDispatchedMessageBuilder(builderDeps, orderStatusService);
        break;
      case OrderStatusCodes.RECEIVED:
        builder = new OrderReceivedMessageBuilder(builderDeps, orderStatusService);
        break;
      case OrderStatusCodes.COMPLETE:
        builder = new OrderResultAvailableMessageBuilder(builderDeps);
        break;
      default:
        return;
    }

    const notifyMessage = await builder.build(builderInput);
    await this.dispatchNotification(notifyMessage, orderId);
  }
}
