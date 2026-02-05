import { HelpLinks } from "./HelpLinks";
import { Tag } from "nhsuk-react-components";

interface ConfirmedStatusProps {
  maxDeliveryDays?: number;
  supplier: string;
}

export function ConfirmedStatus({
  maxDeliveryDays,
  supplier,
}: ConfirmedStatusProps) {
  const maxDays = maxDeliveryDays || 5;

  return (
    <>
      <Tag id="order-status-tag"color="purple" aria-label="Order status: Confirmed">
        Confirmed
      </Tag>
      <h2 className="nhsuk-heading-m">Wait for your kit to be dispatched</h2>
      <p>
        You should receive it within {maxDays} working days from when you placed
        the order.
      </p>
      <hr />
      <HelpLinks supplier={supplier} />
    </>
  );
}
