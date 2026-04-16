import { type OrderStatusCode } from "../../lib/db/order-status-db";

export interface OrderStatusReminderRecord {
  reminderId: string;
  orderUid: string;
  triggerStatus: OrderStatusCode;
  reminderNumber: number;
  triggeredAt: Date;
}
