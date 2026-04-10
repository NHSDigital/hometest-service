import { useCommonContent } from "@/hooks";
import { OrderDetails } from "@/lib/models/order-details";

interface OrderStatusHeaderProps {
  order: OrderDetails;
  heading: string;
}

export function OrderStatusHeader({ order, heading }: Readonly<OrderStatusHeaderProps>) {
  const commonContent = useCommonContent();
  const content = commonContent.orderStatus.header;
  const formattedDate = new Date(order.orderedDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-2">{heading}</h1>
      <p className="nhsuk-body nhsuk-u-margin-bottom-1">
        {content.orderedPrefix} {formattedDate}
      </p>
      <p className="nhsuk-body nhsuk-u-margin-bottom-5">
        {content.referenceNumberPrefix} {order.referenceNumber}
      </p>
    </>
  );
}
