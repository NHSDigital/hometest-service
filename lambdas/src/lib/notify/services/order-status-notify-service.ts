import { type OrderStatusCode } from "../../db/order-status-db";
import {
  type OrderStatusNotifyMessageBuilder,
  type OrderStatusNotifyMessageBuilderInput,
} from "../message-builders/order-status/order-status-notify-message-builder";
import { BaseNotifyService, type NotifyServiceDependencies } from "./base-notify-service";

export interface OrderStatusNotifyServiceDependencies extends NotifyServiceDependencies {
  notifyMessageBuilders: Partial<Record<OrderStatusCode, OrderStatusNotifyMessageBuilder>>;
}

export interface OrderStatusNotifyInput {
  orderId: string;
  patientId: string;
  correlationId: string;
  statusCode: OrderStatusCode;
}

export class OrderStatusNotifyService extends BaseNotifyService {
  private readonly notifyMessageBuilders: Partial<
    Record<OrderStatusCode, OrderStatusNotifyMessageBuilder>
  >;

  constructor(deps: OrderStatusNotifyServiceDependencies) {
    super(deps);
    this.notifyMessageBuilders = deps.notifyMessageBuilders;
  }

  async dispatch(input: OrderStatusNotifyInput): Promise<void> {
    const { statusCode, orderId, patientId, correlationId } = input;

    const notifyMessageBuilder = this.notifyMessageBuilders[statusCode];
    if (!notifyMessageBuilder) {
      return;
    }

    const builderInput: OrderStatusNotifyMessageBuilderInput = {
      orderId,
      patientId,
      correlationId,
    };
    const notifyMessage = await notifyMessageBuilder.build(builderInput);
    await this.dispatchNotification(notifyMessage, orderId);
  }
}
