import { v4 as uuidv4 } from "uuid";

import type { OrderStatusService } from "../lib/db/order-status-db";
import { NotifyEventCode, NotifyMessage } from "../lib/types/notify-message";

export interface BuildOrderDispatchedNotifyMessageInput {
  patientId: string;
  correlationId: string;
  orderId: string;
  dispatchedAt: string;
}

const ORDER_TRACKING_LINK_TEXT = "View kit order update and see more information";

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replaceAll(/\/+$/g, "");

const formatDispatchedDate = (isoDateTime: string): string =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoDateTime));

export class NotifyMessageBuilder {
  private readonly normalizedHomeTestBaseUrl: string;

  constructor(
    private readonly orderStatusDb: OrderStatusService,
    homeTestBaseUrl: string,
  ) {
    this.normalizedHomeTestBaseUrl = normalizeBaseUrl(homeTestBaseUrl);
  }

  async buildOrderDispatchedNotifyMessage(
    input: BuildOrderDispatchedNotifyMessageInput,
  ): Promise<NotifyMessage> {
    const { patientId, correlationId, orderId, dispatchedAt } = input;
    const recipient = await this.orderStatusDb.getNotifyRecipientData(patientId);
    const trackingUrl = `${this.normalizedHomeTestBaseUrl}/orders/${orderId}/tracking`;

    return {
      correlationId,
      messageReference: uuidv4(),
      eventCode: NotifyEventCode.OrderDispatched,
      recipient,
      personalisation: {
        dispatched_date: formatDispatchedDate(dispatchedAt),
        status_url: `[${ORDER_TRACKING_LINK_TEXT}](${trackingUrl})`,
      },
    };
  }
}
