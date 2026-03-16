import { MoreInformationLinks } from "./MoreInformationLinks";
import { Tag } from "nhsuk-react-components";
import { useCommonContent } from "@/hooks";

export function ReceivedStatus() {
  const commonContent = useCommonContent();
  const content = commonContent.orderStatus.statuses.received;

  return (
    <>
      <Tag id="order-status-tag" modifier="blue" aria-label={`Order status: ${content.tag}`}>
        {content.tag}
      </Tag>
      <h2 className="nhsuk-heading-m">{content.heading}</h2>
      <p>{content.message}</p>
      <hr />
      <MoreInformationLinks />
    </>
  );
}
