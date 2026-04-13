import { OrderStatusCodes, OrderStatusService } from "../../db/order-status-db";
import { NotifyEventCode, type NotifyMessage } from "../../types/notify-message";
import {
  BaseNotifyMessageBuilder,
  type NotifyMessageBuilderDependencies,
} from "./base-notify-message-builder";

export interface OrderDispatchedMessageBuilderInput {
  patientId: string;
  orderId: string;
  correlationId: string;
}

export class OrderDispatchedMessageBuilder extends BaseNotifyMessageBuilder {
  constructor(
    deps: NotifyMessageBuilderDependencies,
    private readonly orderStatusService: OrderStatusService,
  ) {
    super(deps);
  }

  async build(input: OrderDispatchedMessageBuilderInput): Promise<NotifyMessage> {
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
