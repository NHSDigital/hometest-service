import { NotifyEventCode, type NotifyMessage } from "../../../types/notify-message";
import {
  BaseNotifyMessageBuilder,
  type NotifyMessageBuilderDependencies,
} from "../base-notify-message-builder";
import { type OrderStatusNotifyMessageBuilderInput } from "./order-status-notify-message-builder";

export class OrderConfirmedMessageBuilder extends BaseNotifyMessageBuilder<OrderStatusNotifyMessageBuilderInput> {
  constructor(deps: NotifyMessageBuilderDependencies) {
    super(deps);
  }

  async build(input: OrderStatusNotifyMessageBuilderInput): Promise<NotifyMessage> {
    const { patientId, orderId, correlationId } = input;

    const [recipient, referenceNumber, orderCreatedAt] = await Promise.all([
      this.getRecipient(patientId),
      this.getReferenceNumber(orderId),
      this.deps.orderDbClient.getOrderCreatedAt(orderId),
    ]);

    return this.buildMessage({
      correlationId,
      eventCode: NotifyEventCode.OrderConfirmed,
      recipient,
      personalisation: {
        orderedDate: this.formatStatusDate(orderCreatedAt),
        orderLinkUrl: this.buildTrackingUrl(orderId),
        referenceNumber,
      },
    });
  }
}
