import { Tag } from "nhsuk-react-components";

import { useCommonContent } from "@/hooks";

import { HelpLinks } from "./HelpLinks";

interface DispatchedStatusProps {
  maxDeliveryDays?: number;
  supplier: string;
  dispatchedDate?: string;
}

export function DispatchedStatus({
  maxDeliveryDays,
  supplier,
  dispatchedDate,
}: Readonly<DispatchedStatusProps>) {
  const commonContent = useCommonContent();
  const content = commonContent.orderStatus.statuses.dispatched;
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
      <Tag id="order-status-tag" modifier="blue" aria-label={`Order status: ${content.tag}`}>
        {content.tag}
      </Tag>
      <h2 className="nhsuk-heading-m">{content.heading}</h2>
      {formattedDispatchedDate && (
        <p aria-label={`Kit dispatched on ${formattedDispatchedDate}`}>
          {content.sentPrefix} {formattedDispatchedDate}
        </p>
      )}
      <p>{content.message.replace("{maxDays}", String(maxDays))}</p>
      <hr />
      <HelpLinks supplier={supplier} />
    </>
  );
}
