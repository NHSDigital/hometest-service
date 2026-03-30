import { OrderDetails, OrderStatus } from "@/lib/models/order-details";

import {
  ConfirmedStatus,
  DispatchedStatus,
  ProcessingStatus,
  ReadyStatus,
  ReceivedStatus,
} from "./statuses";

interface OrderStatusContentProps {
  order: OrderDetails;
}

export function OrderStatusContent({ order }: Readonly<OrderStatusContentProps>) {
  const renderStatus = () => {
    switch (order.status) {
      case OrderStatus.GENERATED:
      case OrderStatus.QUEUED:
        return <ProcessingStatus />;
      case OrderStatus.SUBMITTED:
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
        return <ReadyStatus orderId={order.id} />;
      default:
        return null;
    }
  };

  return (
    <section
      className="nhsuk-u-margin-bottom-5"
      aria-live="polite"
      aria-label={`Order status: ${order.status}`}
    >
      {renderStatus()}
    </section>
  );
}
