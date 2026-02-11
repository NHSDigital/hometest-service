import { useCommonContent } from "@/hooks";

interface HelpLinksProps {
  supplier: string;
}

export function HelpLinks({ supplier }: HelpLinksProps) {
  const commonContent = useCommonContent();
  const content = commonContent.orderStatus.helpLinks;
  const contactSupplierText = content.contactSupplier.replace("{supplier}", supplier);

  return (
    <section aria-labelledby="help-links-heading">
      <h2 id="help-links-heading" className="nhsuk-heading-m">
        {content.heading}
      </h2>
      <p className="nhsuk-body">
        <a
          href="#"
          className="nhsuk-link"
          aria-label={contactSupplierText}
        >
          {contactSupplierText}
        </a>
      </p>
      <p className="nhsuk-body">
        <a
          href="/blood-sample-guide"
          className="nhsuk-link"
          aria-label={content.bloodSampleGuide}
        >
          {content.bloodSampleGuide}
        </a>
      </p>
      <p className="nhsuk-body">
        <a
          href="https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic/?postcode=<POSTCODE>"
          className="nhsuk-link"
          aria-label={content.contactClinic}
        >
          {content.contactClinic}
        </a>
      </p>
      <p className="nhsuk-body">
        <a
          href="https://www.nhs.uk/conditions/hiv-and-aids/"
          className="nhsuk-link"
          aria-label={content.learnMoreHIV}
        >
          {content.learnMoreHIV}
        </a>
      </p>
    </section>
  );
}
