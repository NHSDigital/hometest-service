import { NotifyEventCode, type NotifyMessage } from "../../types/notify-message";
import {
  BaseNotifyMessageBuilder,
  type NotifyMessageBuilderDependencies,
} from "./base-notify-message-builder";

export interface OrderResultAvailableMessageBuilderInput {
  patientId: string;
  orderId: string;
  correlationId: string;
}

export class OrderResultAvailableMessageBuilder extends BaseNotifyMessageBuilder {
  constructor(deps: NotifyMessageBuilderDependencies) {
    super(deps);
  }

  async build(input: OrderResultAvailableMessageBuilderInput): Promise<NotifyMessage> {
    const { patientId, orderId, correlationId } = input;

    const [recipient, referenceNumber, orderCreatedAt] = await Promise.all([
      this.getRecipient(patientId),
      this.getReferenceNumber(orderId),
      this.deps.orderDbClient.getOrderCreatedAt(orderId),
    ]);

    return this.buildMessage({
      correlationId,
      eventCode: NotifyEventCode.ResultReady,
      recipient,
      personalisation: {
        orderedDate: this.formatStatusDate(orderCreatedAt),
        resultLinkUrl: this.buildResultsUrl(orderId),
        referenceNumber,
      },
    });
  }
}
