import { OrderStatus, ResultStatus } from "../../lib/types/status";
import {
  IncomingBusinessStatus,
  IncomingOrderBusinessStatus,
  IncomingResultBusinessStatus,
} from "./types";

export const orderStatusMapping: Record<IncomingOrderBusinessStatus, OrderStatus> = {
  [IncomingBusinessStatus.ORDER_ACCEPTED]: OrderStatus.Confirmed,
  [IncomingBusinessStatus.DISPATCHED]: OrderStatus.Dispatched,
  [IncomingBusinessStatus.RECEIVED_AT_LAB]: OrderStatus.Received,
};

export const resultStatusMapping: Record<IncomingResultBusinessStatus, ResultStatus> = {
  [IncomingBusinessStatus.TEST_PROCESSED]: ResultStatus.Result_Processed,
};

const orderBusinessStatuses: readonly IncomingBusinessStatus[] = [
  IncomingBusinessStatus.ORDER_ACCEPTED,
  IncomingBusinessStatus.DISPATCHED,
  IncomingBusinessStatus.RECEIVED_AT_LAB,
];

export const isIncomingOrderStatus = (
  status: IncomingBusinessStatus,
): status is IncomingOrderBusinessStatus => orderBusinessStatuses.includes(status);

export const isIncomingResultStatus = (
  status: IncomingBusinessStatus,
): status is IncomingResultBusinessStatus => status === IncomingBusinessStatus.TEST_PROCESSED;
