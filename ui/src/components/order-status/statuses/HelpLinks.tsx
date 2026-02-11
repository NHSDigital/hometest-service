import { Link } from "react-router-dom";
import { OpensInNewTabLink } from "@/components/OpensInNewTabLink";
import { useCommonContent } from "@/hooks";

interface HelpLinksProps {
  supplier: string;
}

export function HelpLinks({ supplier }: HelpLinksProps) {
  const commonContent = useCommonContent();
  const content = commonContent.orderStatus.helpLinks;
  const contactSupplierText = content.contactSupplier.replace(
    "{supplier}",
    supplier,
  );

  return (
    <section aria-labelledby="help-links-heading">
      <h2 id="help-links-heading" className="nhsuk-heading-m">
        {content.heading}
      </h2>
      <p className="nhsuk-body">
        <OpensInNewTabLink linkHref="#" linkText={contactSupplierText} />
      </p>
      <p className="nhsuk-body">
        <Link to="/blood-sample-guide" className="nhsuk-link">
          {content.bloodSampleGuide}
        </Link>
      </p>
      <p className="nhsuk-body">
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic/?postcode=<POSTCODE>"
          linkText={content.contactClinic}
        />
      </p>
      <p className="nhsuk-body">
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/conditions/hiv-and-aids/"
          linkText={content.learnMoreHIV}
        />
      </p>
    </section>
  );
}
