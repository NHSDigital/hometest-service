import { HelpLinks } from "./HelpLinks";
import { Tag } from "nhsuk-react-components";
import { useCommonContent } from "@/hooks";

interface ConfirmedStatusProps {
  maxDeliveryDays?: number;
  supplier: string;
}

export function ConfirmedStatus({ maxDeliveryDays, supplier }: ConfirmedStatusProps) {
  const commonContent = useCommonContent();
  const content = commonContent.orderStatus.statuses.confirmed;
  const maxDays = maxDeliveryDays || 5;

  return (
    <>
      <Tag id="order-status-tag" modifier="purple" aria-label={`Order status: ${content.tag}`}>
        {content.tag}
      </Tag>
      <h2 className="nhsuk-heading-m">{content.heading}</h2>
      <p>{content.message.replace("{maxDays}", String(maxDays))}</p>
      <hr />
      <HelpLinks supplier={supplier} />
    </>
  );
}
