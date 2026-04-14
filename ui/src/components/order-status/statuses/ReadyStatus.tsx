import { Link } from "react-router-dom";

import { useCommonContent } from "@/hooks";
import { RoutePath } from "@/lib/models/route-paths";

interface ReadyStatusProps {
  orderId: string;
}

export function ReadyStatus({ orderId }: Readonly<ReadyStatusProps>) {
  const commonContent = useCommonContent();
  const content = commonContent.orderStatus.statuses.ready;

  return (
    <>
      <h2 className="nhsuk-heading-m">{content.heading}</h2>
      <p>
        <Link to={RoutePath.TestResultsPage.replace(":orderId", orderId)} className="nhsuk-link">
          {content.viewResultLink}
        </Link>
      </p>
      <hr />
    </>
  );
}
