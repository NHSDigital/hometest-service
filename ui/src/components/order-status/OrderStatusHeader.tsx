import { Order } from "@/types/order";

interface OrderStatusHeaderProps {
  order: Order;
}

export function OrderStatusHeader({ order }: OrderStatusHeaderProps) {
  const formattedDate = new Date(order.orderedDate).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <header className="nhsuk-u-margin-bottom-5" aria-label="Order details">
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-2">
        {order.testType}
      </h1>
      <p className="nhsuk-body nhsuk-u-margin-bottom-1">
        <span aria-label={`Order date: ${formattedDate}`}>
          Ordered {formattedDate}
        </span>
      </p>
      <p className="nhsuk-body">
        <span aria-label={`Reference number: ${order.referenceNumber}`}>
          Reference number {order.referenceNumber}
        </span>
      </p>
    </header>
  );
}
