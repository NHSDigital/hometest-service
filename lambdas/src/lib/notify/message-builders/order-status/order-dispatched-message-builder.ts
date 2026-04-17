import { OrderStatusCodes, OrderStatusService } from "../../../db/order-status-db";
import { NotifyEventCode, type NotifyMessage } from "../../../types/notify-message";
import {
  BaseNotifyMessageBuilder,
  type NotifyMessageBuilderDependencies,
} from "../base-notify-message-builder";
import { type OrderStatusNotifyMessageBuilderInput } from "./order-status-notify-message-builder";

export class OrderDispatchedMessageBuilder extends BaseNotifyMessageBuilder<OrderStatusNotifyMessageBuilderInput> {
  constructor(
    deps: NotifyMessageBuilderDependencies,
    private readonly orderStatusService: OrderStatusService,
  ) {
    super(deps);
  }

  async build(input: OrderStatusNotifyMessageBuilderInput): Promise<NotifyMessage> {
    const { patientId, orderId, correlationId } = input;

    const [recipient, referenceNumber, dispatchedAt] = await Promise.all([
      this.getRecipient(patientId),
      this.getReferenceNumber(orderId),
      this.orderStatusService.getOrderStatusCreatedAt(orderId, OrderStatusCodes.DISPATCHED),
    ]);

    return this.buildMessage({
      correlationId,
      eventCode: NotifyEventCode.OrderDispatched,
      recipient,
      personalisation: {
        dispatchedDate: this.formatStatusDate(dispatchedAt),
        orderLinkUrl: this.buildTrackingUrl(orderId),
        referenceNumber,
      },
    });
  }
}
