export interface NotifyMessage {
  correlationId: string;
  messageReference: string;
  eventCode: NotifyEventCode | string;
  recipient: NotifyRecipient;
  personalisation?: Record<string, unknown>;
}

export interface NotifyRecipient {
  nhsNumber: string;
  dateOfBirth: string;
}

export enum NotifyEventCode {
  OrderConfirmed = "ORDER_CONFIRMED",
  OrderDispatched = "ORDER_DISPATCHED",
  OrderReceived = "ORDER_RECEIVED",
  ResultReady = "RESULT_READY",
}
