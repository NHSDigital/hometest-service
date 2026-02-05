import { Link } from "react-router-dom";
import { OpensInNewTabLink } from "@/components/OpensInNewTabLink";

interface HelpLinksProps {
  supplier: string;
}

export function HelpLinks({ supplier }: HelpLinksProps) {
  return (
    <section aria-labelledby="help-links-heading">
      <h2 id="help-links-heading" className="nhsuk-heading-m">
        Still need help?
      </h2>
      <p className="nhsuk-body">
        <OpensInNewTabLink
          linkHref="#"
          linkText={`Contact ${supplier}, the kit supplier`}
        />
      </p>
      <p className="nhsuk-body">
        <Link to="/blood-sample-guide" className="nhsuk-link">
          Blood sample step-by-step guide
        </Link>
      </p>
      <p className="nhsuk-body">
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic/?postcode=<POSTCODE>"
          linkText="Contact my nearest sexual health clinic"
        />
      </p>
      <p className="nhsuk-body">
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/conditions/hiv-and-aids/"
          linkText="Learn more about HIV and AIDS"
        />
      </p>
    </section>
  );
}
