export type UUID = string;

<<<<<<< HEAD
export type OrderStatusCode = "ORDER_RECEIVED" | "DISPATCHED" | "RECEIVED" | "COMPLETE";
=======
export type OrderStatusCode = "CONFIRMED" | "DISPATCHED" | "RECEIVED" | "COMPLETE";
>>>>>>> origin/main
export interface TestOrderModel {
  order_uid: string;
  order_reference: number;
  supplier_id: string;
  patient_uid: string;
  test_code: string;
  originator: string | null;
  created_at: Date;
  supplier_name: string;
  nhs_number: string;
  birth_date: Date;
  status_code: OrderStatusCode;
}
export interface Supplier {
  supplier_id: UUID;
  supplier_name: "Preventx" | "SH:24";
}
export interface CreateOrderInput {
  nhs_number: string;
  birth_date: string;
  supplier_name: Supplier["supplier_name"];
  test_code: string;
  originator?: string;
  initial_status: OrderStatusCode;
}

export function isValidOrder(order: TestOrderModel): boolean {
  return (
    !!order.order_uid &&
    !!order.order_reference &&
    !!order.supplier_id &&
    !!order.patient_uid &&
    !!order.test_code &&
    order.created_at instanceof Date
  );
}
