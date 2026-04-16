import { OrderStatusCodes, OrderStatusService } from "../../lib/db/order-status-db";
import {
  BaseNotifyMessageBuilder,
  type NotifyMessageBuilderDependencies,
} from "../../lib/notify/message-builders/base-notify-message-builder";
import { NotifyEventCode, type NotifyMessage } from "../../lib/types/notify-message";

export interface DispatchedReminderMessageBuilderInput {
  reminderId: string;
  patientId: string;
  orderId: string;
  correlationId: string;
  eventCode: NotifyEventCode;
}

export class DispatchedReminderMessageBuilder extends BaseNotifyMessageBuilder<DispatchedReminderMessageBuilderInput> {
  constructor(
    deps: NotifyMessageBuilderDependencies,
    private readonly orderStatusService: OrderStatusService,
  ) {
    super(deps);
  }

  async build(input: DispatchedReminderMessageBuilderInput): Promise<NotifyMessage> {
    const { reminderId, patientId, orderId, correlationId, eventCode } = input;

    const [recipient, referenceNumber, dispatchedAt] = await Promise.all([
      this.getRecipient(patientId),
      this.getReferenceNumber(orderId),
      this.orderStatusService.getOrderStatusCreatedAt(orderId, OrderStatusCodes.DISPATCHED),
    ]);

    return this.buildMessage({
      correlationId,
      eventCode,
      recipient,
      messageReference: reminderId,
      personalisation: {
        dispatchedDate: this.formatStatusDate(dispatchedAt),
        orderLinkUrl: this.buildTrackingUrl(orderId),
        referenceNumber,
      },
    });
  }
}
