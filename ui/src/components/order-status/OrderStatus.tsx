import { Order } from "@/types/order";
import { OrderStatusContent } from "./OrderStatusContent";
import { OrderStatusHeader } from "./OrderStatusHeader";

interface OrderStatusProps {
  order: Order;
}

export function OrderStatus({ order }: OrderStatusProps) {
  return (
    <section aria-label="Order status information">
      <OrderStatusHeader order={order} />
      <OrderStatusContent order={order} />
    </section>
  );
}
