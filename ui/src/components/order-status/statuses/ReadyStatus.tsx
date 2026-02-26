import { Link } from "react-router-dom";
import { RoutePath } from "@/lib/models/route-paths";
import { useCommonContent } from "@/hooks";

interface ReadyStatusProps {
  orderId: string;
}

export function ReadyStatus({ orderId }: ReadyStatusProps) {
  const commonContent = useCommonContent();
  const content = commonContent.orderStatus.statuses.ready;

  return (
    <>
      <h2 className="nhsuk-heading-m">{content.heading}</h2>
      <p>
        <Link
          to={RoutePath.TestResultsPage.replace(":orderId", orderId)}
          className="nhsuk-link"
          aria-label={content.viewResultLink}
        >
          {content.viewResultLink}
        </Link>
      </p>
      <hr />
    </>
  );
}
