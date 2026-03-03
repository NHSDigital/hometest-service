import { OrderDetails } from "@/lib/models/order-details";
import { OrderStatusContent } from "./OrderStatusContent";
import { OrderStatusHeader } from "./OrderStatusHeader";

interface OrderStatusProps {
  order: OrderDetails;
}

export function OrderStatus({ order }: OrderStatusProps) {
  return (
    <section aria-label="Order status information">
      <OrderStatusHeader order={order} heading="HIV self-test" />
      <OrderStatusContent order={order} />
    </section>
  );
}
