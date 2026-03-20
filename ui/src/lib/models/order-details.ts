export enum OrderStatus {
  GENERATED = "GENERATED",
  QUEUED = "QUEUED",
  SUBMITTED = "SUBMITTED",
  CONFIRMED = "CONFIRMED",
  DISPATCHED = "DISPATCHED",
  RECEIVED = "RECEIVED",
  COMPLETE = "COMPLETE",
}

export interface OrderDetails {
  id: string;
  orderedDate: string;
  referenceNumber: string;
  status: OrderStatus;
  supplier: string;
  dispatchedDate?: string;
  maxDeliveryDays?: number;
}
