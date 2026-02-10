import { Order } from "@/types/order";
import { useCommonContent } from "@/hooks";

interface OrderStatusHeaderProps {
  order: Order;
}

export function OrderStatusHeader({ order }: OrderStatusHeaderProps) {
  const commonContent = useCommonContent();
  const content = commonContent.orderStatus.header;
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
      <p id="order-date" className="nhsuk-body nhsuk-u-margin-bottom-1">
        <span aria-label={`Order date: ${formattedDate}`}>
          {content.orderedPrefix} {formattedDate}
        </span>
      </p>
      <p id="reference-number" className="nhsuk-body">
        <span aria-label={`Reference number: ${order.referenceNumber}`}>
          {content.referenceNumberPrefix} {order.referenceNumber}
        </span>
      </p>
    </header>
  );
}
