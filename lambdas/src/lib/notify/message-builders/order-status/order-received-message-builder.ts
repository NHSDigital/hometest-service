import { OrderStatusCodes, OrderStatusService } from "../../../db/order-status-db";
import { NotifyEventCode, type NotifyMessage } from "../../../types/notify-message";
import {
  BaseNotifyMessageBuilder,
  type NotifyMessageBuilderDependencies,
} from "../base-notify-message-builder";
import { type OrderStatusNotifyMessageBuilderInput } from "./order-status-notify-message-builder";

export class OrderReceivedMessageBuilder extends BaseNotifyMessageBuilder<OrderStatusNotifyMessageBuilderInput> {
  constructor(
    deps: NotifyMessageBuilderDependencies,
    private readonly orderStatusService: OrderStatusService,
  ) {
    super(deps);
  }

  async build(input: OrderStatusNotifyMessageBuilderInput): Promise<NotifyMessage> {
    const { patientId, orderId, correlationId } = input;

    const [recipient, referenceNumber, receivedAt] = await Promise.all([
      this.getRecipient(patientId),
      this.getReferenceNumber(orderId),
      this.orderStatusService.getOrderStatusCreatedAt(orderId, OrderStatusCodes.RECEIVED),
    ]);

    return this.buildMessage({
      correlationId,
      eventCode: NotifyEventCode.OrderReceived,
      recipient,
      personalisation: {
        receivedDate: this.formatStatusDate(receivedAt),
        orderLinkUrl: this.buildTrackingUrl(orderId),
        referenceNumber,
      },
    });
  }
}
