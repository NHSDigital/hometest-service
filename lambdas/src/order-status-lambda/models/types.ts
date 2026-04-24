export enum IncomingBusinessStatus {
  ORDER_ACCEPTED = "order-accepted",
  DISPATCHED = "dispatched",
  RECEIVED_AT_LAB = "received-at-lab",
  TEST_PROCESSED = "test-processed",
}

export type IncomingOrderBusinessStatus =
  | IncomingBusinessStatus.ORDER_ACCEPTED
  | IncomingBusinessStatus.DISPATCHED
  | IncomingBusinessStatus.RECEIVED_AT_LAB;

export type IncomingResultBusinessStatus = IncomingBusinessStatus.TEST_PROCESSED;
