import type { NotifyMessageBuilder } from "../base-notify-message-builder";

export interface OrderStatusNotifyMessageBuilderInput {
  patientId: string;
  orderId: string;
  correlationId: string;
}

export type OrderStatusNotifyMessageBuilder =
  NotifyMessageBuilder<OrderStatusNotifyMessageBuilderInput>;
