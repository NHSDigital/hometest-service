import { HelpLinks } from "./HelpLinks";
import { Tag } from "nhsuk-react-components";

interface DispatchedStatusProps {
  maxDeliveryDays?: number;
  supplier: string;
  dispatchedDate?: string;
}

export function DispatchedStatus({
  maxDeliveryDays,
  supplier,
  dispatchedDate,
}: DispatchedStatusProps) {
  const maxDays = maxDeliveryDays || 5;
  const formattedDispatchedDate = dispatchedDate
    ? new Date(dispatchedDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <>
      <Tag id="order-status-tag" color="blue" aria-label="Order status: Dispatched">
        Dispatched
      </Tag>
      <h2 className="nhsuk-heading-m">Wait for your kit to arrive</h2>
      {formattedDispatchedDate && (
        <p aria-label={`Kit dispatched on ${formattedDispatchedDate}`}>
          Sent {formattedDispatchedDate}
        </p>
      )}
      <p>You should receive it within {maxDays} working days.</p>
      <hr />
      <HelpLinks supplier={supplier} />
    </>
  );
}
