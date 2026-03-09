import { Link } from "react-router-dom";
import { RoutePath } from "@/lib/models/route-paths";
import { useCommonContent } from "@/hooks";

interface AboutServiceProps {
  supplier: string;
}

export function AboutService({ supplier }: AboutServiceProps) {
  const commonContent = useCommonContent();
  const content = commonContent.orderStatus.aboutService;

  return (
    <div className="nhsuk-u-margin-top-7">
      <h2 className="nhsuk-heading-m">{content.heading}</h2>
      <p className="nhsuk-body">
        {`${content.homeTestPrefix} `}
        <Link
          to="/home-test-terms-of-use"
          className="nhsuk-link"
          aria-label={`${content.homeTestPrefix} ${content.termsOfUse}`}
        >
          {content.termsOfUse}
        </Link>
        {` ${content.and} `}
        <Link
          to={RoutePath.HomeTestPrivacyPolicyPage}
          className="nhsuk-link"
          aria-label={`${content.homeTestPrefix} ${content.privacyPolicy}`}
        >
          {content.privacyPolicy}
        </Link>
        .
      </p>
      <p className="nhsuk-body">
        {`${supplier} `}
        <Link
          to={`${RoutePath.SuppliersTermsConditions}?supplier=${encodeURIComponent(supplier)}`}
          className="nhsuk-link"
          aria-label={`${supplier} ${content.termsOfUse}`}
        >
          {content.termsOfUse}
        </Link>
        {` ${content.and} `}
        <Link
          to="/suppliers-privacy-policy"
          className="nhsuk-link"
          aria-label={`${supplier} ${content.privacyPolicy}`}
        >
          {content.privacyPolicy}
        </Link>
        .
      </p>
    </div>
  );
}
