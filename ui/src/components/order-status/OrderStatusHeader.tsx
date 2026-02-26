import { OrderDetails } from "@/lib/models/order-details";
import { useCommonContent } from "@/hooks";

interface OrderStatusHeaderProps {
  order: OrderDetails;
  heading: string;
}

export function OrderStatusHeader({
  order,
  heading,
}: OrderStatusHeaderProps) {
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
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-2">{heading}</h1>
      <p className="nhsuk-body nhsuk-u-margin-bottom-1">
        <span aria-label={`Order date: ${formattedDate}`}>
          {content.orderedPrefix} {formattedDate}
        </span>
      </p>
      <p className="nhsuk-body">
        <span aria-label={`Reference number: ${order.referenceNumber}`}>
          {content.referenceNumberPrefix} {order.referenceNumber}
        </span>
      </p>
    </header>
  );
}
