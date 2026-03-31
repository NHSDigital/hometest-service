export interface NotifyMessage {
  correlationId: string;
  messageReference: string;
  eventCode: NotifyEventCode;
  recipient: NotifyRecipient;
  personalisation?: Record<string, unknown>;
}

export interface NotifyRecipient {
  nhsNumber: string;
  dateOfBirth: string;
}

export enum NotifyEventCode {
  OrderConfirmed = "ORDER_CONFIRMED",
}
