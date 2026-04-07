import { v4 as uuidv4 } from "uuid";

import type { PatientDbClient } from "../db/patient-db-client";
import { NotifyEventCode, NotifyMessage, NotifyRecipient } from "../types/notify-message";

export interface BuildOrderDispatchedNotifyMessageInput {
  patientId: string;
  correlationId: string;
  orderId: string;
  dispatchedAt: string;
}

export interface BuildOrderReceivedNotifyMessageInput {
  patientId: string;
  correlationId: string;
  orderId: string;
  receivedAt: string;
}

export interface BuildResultReadyNotifyMessageInput {
  patientId: string;
  correlationId: string;
  orderId: string;
  receivedAt: string;
}

const ORDER_TRACKING_LINK_TEXT = "View kit order update and see more information";
const ORDER_RESULTS_LINK_TEXT = "View your result";

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
    homeTestBaseUrl: string,
  ) {
    this.normalizedHomeTestBaseUrl = homeTestBaseUrl.replaceAll(/\/$/g, "");
  }

  async buildOrderDispatchedNotifyMessage(
    input: BuildOrderDispatchedNotifyMessageInput,
  ): Promise<NotifyMessage> {
    const { patientId, correlationId, orderId, dispatchedAt } = input;

    const trackingUrl = `${this.normalizedHomeTestBaseUrl}/orders/${orderId}/tracking`;

    return this.buildOrderStatusNotifyMessage({
      patientId,
      correlationId,
      eventCode: NotifyEventCode.OrderDispatched,
      personalisation: {
        dispatchedDate: formatStatusDate(dispatchedAt),
        statusLink: `[${ORDER_TRACKING_LINK_TEXT}](${trackingUrl})`,
      },
    });
  }

  async buildOrderReceivedNotifyMessage(
    input: BuildOrderReceivedNotifyMessageInput,
  ): Promise<NotifyMessage> {
    const { patientId, correlationId, orderId, receivedAt } = input;

    const trackingUrl = `${this.normalizedHomeTestBaseUrl}/orders/${orderId}/tracking`;

    return this.buildOrderStatusNotifyMessage({
      patientId,
      correlationId,
      eventCode: NotifyEventCode.OrderReceived,
      personalisation: {
        receivedDate: formatStatusDate(receivedAt),
        statusLink: `[${ORDER_TRACKING_LINK_TEXT}](${trackingUrl})`,
      },
    });
  }

  async buildOrderResultAvailableNotifyMessage(
    input: BuildResultReadyNotifyMessageInput,
  ): Promise<NotifyMessage> {
    const { patientId, correlationId, orderId, receivedAt } = input;

    const resultsUrl = `${this.normalizedHomeTestBaseUrl}/order/${orderId}/results`;

    return this.buildOrderStatusNotifyMessage({
      patientId,
      correlationId,
      eventCode: NotifyEventCode.ResultReady,
      personalisation: {
        receivedDate: formatStatusDate(receivedAt),
        resultLink: `[${ORDER_RESULTS_LINK_TEXT}](${resultsUrl})`,
      },
    });
  }

  private async buildOrderStatusNotifyMessage(input: {
    patientId: string;
    correlationId: string;
    eventCode: NotifyEventCode;
    personalisation: Record<string, string>;
  }): Promise<NotifyMessage> {
    const { patientId, correlationId, eventCode, personalisation } = input;

    const patient = await this.patientDbClient.get(patientId);
    const recipient: NotifyRecipient = {
      nhsNumber: patient.nhsNumber,
      dateOfBirth: patient.birthDate,
    };

    return {
      correlationId,
      messageReference: uuidv4(),
      eventCode,
      recipient,
      personalisation,
    };
  }
}
