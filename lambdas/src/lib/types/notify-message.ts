export interface NotifyMessage {
  correlationId: string;
  messageReference: string;
  eventCode: string;
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
  DispatchedInitialReminder = "DISPATCHED_INITIAL_REMINDER",
  DispatchedSecondReminder = "DISPATCHED_SECOND_REMINDER",
  OrderReceived = "ORDER_RECEIVED",
  ResultReady = "RESULT_READY",
}
