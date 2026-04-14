import { v4 as uuidv4 } from "uuid";

import type { OrderDbClient } from "../../db/order-db-client";
import type { PatientDbClient } from "../../db/patient-db-client";
import type { NotifyMessage, NotifyRecipient } from "../../types/notify-message";

export interface NotifyMessageBuilder<TInput> {
  build(input: TInput): Promise<NotifyMessage>;
}

export interface NotifyMessageBuilderDependencies {
  patientDbClient: PatientDbClient;
  orderDbClient: OrderDbClient;
  homeTestBaseUrl: string;
}

export abstract class BaseNotifyMessageBuilder<TInput> implements NotifyMessageBuilder<TInput> {
  private readonly normalizedHomeTestBaseUrl: string;

  constructor(protected readonly deps: NotifyMessageBuilderDependencies) {
    this.normalizedHomeTestBaseUrl = deps.homeTestBaseUrl.replaceAll(/\/$/g, "");
  }

  abstract build(input: TInput): Promise<NotifyMessage>;

  protected async getRecipient(patientId: string): Promise<NotifyRecipient> {
    const patient = await this.deps.patientDbClient.get(patientId);
    return { nhsNumber: patient.nhsNumber, dateOfBirth: patient.birthDate };
  }

  protected async getReferenceNumber(orderId: string): Promise<string> {
    return this.deps.orderDbClient.getOrderReferenceNumber(orderId);
  }

  protected buildTrackingUrl(orderId: string): string {
    return `${this.normalizedHomeTestBaseUrl}/orders/${orderId}/tracking`;
  }

  protected buildResultsUrl(orderId: string): string {
    return `${this.normalizedHomeTestBaseUrl}/orders/${orderId}/results`;
  }

  protected buildMessage(params: {
    correlationId: string;
    eventCode: string;
    recipient: NotifyRecipient;
    personalisation: Record<string, string>;
    messageReference?: string;
  }): NotifyMessage {
    return {
      correlationId: params.correlationId,
      messageReference: params.messageReference ?? uuidv4(),
      eventCode: params.eventCode,
      recipient: params.recipient,
      personalisation: params.personalisation,
    };
  }

  protected formatStatusDate(isoDateTime: string): string {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(isoDateTime));
  }
}
