export type OrderStatus = "confirmed" | "dispatched" | "received" | "ready";

export interface Order {
  id: string;
  testType: string;
  orderedDate: string;
  referenceNumber: string;
  status: OrderStatus;
  supplier: string;
  dispatchedDate?: string;
  maxDeliveryDays?: number;
}
