import { type OrderStatusCode } from "../../lib/db/order-status-db";
import { type NotifyEventCode } from "../../lib/types/notify-message";

export interface OrderStatusReminderRecord {
  reminderId: string;
  orderUid: string;
  triggerStatus: OrderStatusCode;
  reminderNumber: number;
  triggeredAt: Date;
}

export interface ReminderScheduleTuple {
  triggerStatus: string;
  reminderNumber: number;
  intervalDays: number;
  eventCode: NotifyEventCode;
}
