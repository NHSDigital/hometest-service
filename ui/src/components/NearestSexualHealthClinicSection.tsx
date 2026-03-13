import { OpensInNewTabLink } from "@/components/OpensInNewTabLink";

// stub, will be replaced later
export function NearestSexualHealthClinicSection({ showTitle = true }: Readonly<{ showTitle?: boolean }>) {
  return (
    <>
      {showTitle && <h2>Contact your nearest sexual health clinic</h2>}
      <p className="nhsuk-body">
        To get tested for HIV, go to your nearest sexual health clinic, which is:
      </p>
      <p className="nhsuk-body-s nhsuk-u-margin-bottom-2">1.1 miles away</p>
      <h2 className="nhsuk-heading-m">
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/services/service-directory/locala-sexual-health/N10507429?gsdServiceId=734"
          linkText="Sexual health clinic name"
        />
      </h2>
      <p className="nhsuk-body">17/21 Dod Street, Poplar, London, E14 7EG</p>
      <p className="nhsuk-body">
        Phone: <a href="tel:01211231234">0121 123 1234</a>
      </p>
      <p className="nhsuk-body">
        <OpensInNewTabLink
          linkHref="https://www.google.com/maps/search/Locala+Sexual+Health+Princess+Royal+Community+Health+Centre+Greenhead+Road++Huddersfield+West+Yorkshire+HD1+4EW/@53.646385192871094,-1.790373921394348,17z"
          linkText="Get directions (opens in Google Maps)"
        />
      </p>
    </>
  );
}
