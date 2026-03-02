import { ConfirmedStatus, DispatchedStatus, ReadyStatus, ReceivedStatus } from "./statuses";
import { OrderDetails, OrderStatus } from "@/lib/models/order-details";

interface OrderStatusContentProps {
  order: OrderDetails;
}

export function OrderStatusContent({ order }: OrderStatusContentProps) {
  const renderStatus = () => {
    switch (order.status) {
      case OrderStatus.CONFIRMED:
        return (
          <ConfirmedStatus maxDeliveryDays={order.maxDeliveryDays} supplier={order.supplier} />
        );
      case OrderStatus.DISPATCHED:
        return (
          <DispatchedStatus
            maxDeliveryDays={order.maxDeliveryDays}
            supplier={order.supplier}
            dispatchedDate={order.dispatchedDate}
          />
        );
      case OrderStatus.RECEIVED:
        return <ReceivedStatus />;
      case OrderStatus.COMPLETE:
        return <ReadyStatus />;
      default:
        return null;
    }
  };

  return (
    <div
      className="nhsuk-u-margin-bottom-5"
      role="region"
      aria-live="polite"
      aria-label={`Order status: ${order.status}`}
    >
      {renderStatus()}
    </div>
  );
}
