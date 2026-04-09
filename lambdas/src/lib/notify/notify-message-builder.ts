import { v4 as uuidv4 } from "uuid";

import type { OrderDbClient } from "../db/order-db-client";
import { OrderStatusCodes, OrderStatusService } from "../db/order-status-db";
import type { PatientDbClient } from "../db/patient-db-client";
import { NotifyEventCode, NotifyMessage, NotifyRecipient } from "../types/notify-message";

export interface BuildOrderNotifyMessageInput {
  patientId: string;
  correlationId: string;
  orderId: string;
}

const formatStatusDate = (isoDateTime: string): string =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoDateTime));

export class NotifyMessageBuilder {
  private readonly normalizedHomeTestBaseUrl: string;

  constructor(
    private readonly patientDbClient: PatientDbClient,
    private readonly orderDbClient: OrderDbClient,
    private readonly orderStatusService: OrderStatusService,
    homeTestBaseUrl: string,
  ) {
    this.normalizedHomeTestBaseUrl = homeTestBaseUrl.replaceAll(/\/$/g, "");
  }

  async buildOrderDispatchedNotifyMessage(
    input: BuildOrderNotifyMessageInput,
  ): Promise<NotifyMessage> {
    const { patientId, correlationId, orderId } = input;

    const dispatchedAt = await this.orderStatusService.getOrderStatusCreatedAt(
      orderId,
      OrderStatusCodes.DISPATCHED,
    );

    const trackingUrl = this.buildOrderTrackingUrl(orderId);

    return this.buildOrderStatusNotifyMessage({
      patientId,
      correlationId,
      orderId,
      eventCode: NotifyEventCode.OrderDispatched,
      personalisation: {
        dispatchedDate: formatStatusDate(dispatchedAt),
        orderLinkUrl: trackingUrl,
      },
    });
  }

  async buildOrderReceivedNotifyMessage(
    input: BuildOrderNotifyMessageInput,
  ): Promise<NotifyMessage> {
    const { patientId, correlationId, orderId } = input;

    const receivedAt = await this.orderStatusService.getOrderStatusCreatedAt(
      orderId,
      OrderStatusCodes.RECEIVED,
    );

    const trackingUrl = this.buildOrderTrackingUrl(orderId);

    return this.buildOrderStatusNotifyMessage({
      patientId,
      correlationId,
      orderId,
      eventCode: NotifyEventCode.OrderReceived,
      personalisation: {
        receivedDate: formatStatusDate(receivedAt),
        orderLinkUrl: trackingUrl,
      },
    });
  }

  async buildOrderResultAvailableNotifyMessage(
    input: BuildOrderNotifyMessageInput,
  ): Promise<NotifyMessage> {
    const { patientId, correlationId, orderId } = input;

    const orderCreatedAt = await this.orderDbClient.getOrderCreatedAt(orderId);

    const resultsUrl = this.buildOrderResultsUrl(orderId);

    return this.buildOrderStatusNotifyMessage({
      patientId,
      correlationId,
      orderId,
      eventCode: NotifyEventCode.ResultReady,
      personalisation: {
        orderedDate: formatStatusDate(orderCreatedAt),
        resultLinkUrl: resultsUrl,
      },
    });
  }

  private async buildOrderStatusNotifyMessage(input: {
    patientId: string;
    correlationId: string;
    orderId: string;
    eventCode: NotifyEventCode;
    personalisation: Record<string, string>;
  }): Promise<NotifyMessage> {
    const { patientId, correlationId, orderId, eventCode, personalisation } = input;

    const patient = await this.patientDbClient.get(patientId);
    const recipient: NotifyRecipient = {
      nhsNumber: patient.nhsNumber,
      dateOfBirth: patient.birthDate,
    };

    const referenceNumber = await this.orderDbClient.getOrderReferenceNumber(orderId);

    return {
      correlationId,
      messageReference: uuidv4(),
      eventCode,
      recipient,
      personalisation: {
        ...personalisation,
        referenceNumber: referenceNumber.toString(),
      },
    };
  }

  private buildOrderTrackingUrl(orderId: string): string {
    return `${this.normalizedHomeTestBaseUrl}/orders/${orderId}/tracking`;
  }

  private buildOrderResultsUrl(orderId: string): string {
    return `${this.normalizedHomeTestBaseUrl}/orders/${orderId}/results`;
  }
}
