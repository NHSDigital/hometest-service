interface HelpLinksProps {
  supplier: string;
}

export function HelpLinks({ supplier }: HelpLinksProps) {
  return (
    <section aria-labelledby="help-links-heading">
      <h2 id="help-links-heading" className="nhsuk-heading-m">
        Still need help?
      </h2>
      <ul className="nhsuk-list" role="list">
        <li>
          <a
            href="#"
            className="nhsuk-link"
            aria-label={`Contact ${supplier}, the kit supplier for support`}
          >
            Contact {supplier}, the kit supplier
          </a>
        </li>
        <li>
          <a
            href="/blood-sample-guide"
            className="nhsuk-link"
            aria-label="View blood sample step-by-step guide"
          >
            Blood sample step-by-step guide
          </a>
        </li>
        <li>
          <a
            href="https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic/?postcode=<POSTCODE>"
            className="nhsuk-link"
            aria-label="Find and contact your nearest sexual health clinic"
          >
            Contact my nearest sexual health clinic
          </a>
        </li>
        <li>
          <a
            href="https://www.nhs.uk/conditions/hiv-and-aids/"
            className="nhsuk-link"
            aria-label="Learn more about HIV and AIDS on NHS website"
          >
            Learn more about HIV and AIDS
          </a>
        </li>
      </ul>
    </section>
  );
}
