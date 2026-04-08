import { v4 as uuidv4 } from "uuid";

import type { PatientDbClient } from "../lib/db/patient-db-client";
import { NotifyEventCode, NotifyMessage, NotifyRecipient } from "../lib/types/notify-message";

export interface BuildOrderDispatchedNotifyMessageInput {
  patientId: string;
  correlationId: string;
  orderId: string;
  dispatchedAt: string;
}

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
    private readonly patientDbClient: PatientDbClient,
    homeTestBaseUrl: string,
  ) {
    this.normalizedHomeTestBaseUrl = homeTestBaseUrl.replaceAll(/\/$/g, "");
  }

  async buildOrderDispatchedNotifyMessage(
    input: BuildOrderDispatchedNotifyMessageInput,
  ): Promise<NotifyMessage> {
    const { patientId, correlationId, orderId, dispatchedAt } = input;

    const patient = await this.patientDbClient.get(patientId);
    const recipient: NotifyRecipient = {
      nhsNumber: patient.nhsNumber,
      dateOfBirth: patient.birthDate,
    };

    const trackingUrl = `${this.normalizedHomeTestBaseUrl}/orders/${orderId}/tracking`;

    return {
      correlationId,
      messageReference: uuidv4(),
      eventCode: NotifyEventCode.OrderDispatched,
      recipient,
      personalisation: {
        dispatchedDate: formatDispatchedDate(dispatchedAt),
        orderLinkUrl: trackingUrl,
      },
    };
  }
}
