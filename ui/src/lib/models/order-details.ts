export type OrderStatus = "confirmed" | "dispatched" | "received" | "ready";

export interface IOrderDetails {
  id: string;
  orderedDate: string;
  referenceNumber: string;
  status: OrderStatus;
  supplier: string;
  dispatchedDate?: string;
  maxDeliveryDays?: number;
}