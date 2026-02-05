import { MoreInformationLinks } from "./MoreInformationLinks";
import { Tag } from "nhsuk-react-components";

export function ReceivedStatus() {
  return (
    <>
      <Tag
        id="order-status-tag"
        color="blue"
        aria-label="Order status: Test received"
      >
        Test received
      </Tag>
      <h2 className="nhsuk-heading-m">Wait for your result</h2>
      <p>We&rsquo;ll contact you when it&rsquo;s ready.</p>
      <hr />
      <MoreInformationLinks />
    </>
  );
}
