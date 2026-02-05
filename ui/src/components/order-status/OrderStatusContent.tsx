import {
  ConfirmedStatus,
  DispatchedStatus,
  ReadyStatus,
  ReceivedStatus,
} from "./statuses";

import { Order } from "@/types/order";

interface OrderStatusContentProps {
  order: Order;
}

export function OrderStatusContent({ order }: OrderStatusContentProps) {
  const renderStatus = () => {
    switch (order.status) {
      case "confirmed":
        return (
          <ConfirmedStatus
            maxDeliveryDays={order.maxDeliveryDays}
            supplier={order.supplier}
          />
        );
      case "dispatched":
        return (
          <DispatchedStatus
            maxDeliveryDays={order.maxDeliveryDays}
            supplier={order.supplier}
            dispatchedDate={order.dispatchedDate}
          />
        );
      case "received":
        return <ReceivedStatus />;
      case "ready":
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
