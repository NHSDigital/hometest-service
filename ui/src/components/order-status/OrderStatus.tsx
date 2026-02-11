import { OrderDetails } from "@/lib/models/order-details";
import { OrderStatusContent } from "./OrderStatusContent";
import { OrderStatusHeader } from "./OrderStatusHeader";

interface OrderStatusProps {
  order: OrderDetails;
}

export function OrderStatus({ order }: OrderStatusProps) {
  return (
    <section aria-label="Order status information">
      <OrderStatusHeader order={order} />
      <OrderStatusContent order={order} />
    </section>
  );
}
