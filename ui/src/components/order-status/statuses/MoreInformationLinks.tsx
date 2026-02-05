import { OpensInNewTabLink } from "@/components/OpensInNewTabLink";

export function MoreInformationLinks() {
  return (
    <section aria-labelledby="more-info-heading">
      <h2 id="more-info-heading" className="nhsuk-heading-m">
        More information
      </h2>
      <p className="nhsuk-body">
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/conditions/hiv-and-aids/"
          linkText="Learn more about HIV and AIDS"
        />
      </p>
    </section>
  );
}
