import { OpensInNewTabLink } from "@/components/OpensInNewTabLink";
import { usePageContent } from "@/hooks";

interface MoreOptionsAndInformationProps {
  supplier: string;
}

export function MoreOptionsAndInformation({
  supplier,
}: MoreOptionsAndInformationProps) {
  const content = usePageContent("test-results").moreOptionsAndInformation;
  const fullCheckLinkText = content.fullCheckLink.replace(
    "{supplier}",
    supplier,
  );

  return (
    <section aria-labelledby="more-options-and-information-heading">
      <h2
        id="more-options-and-information-heading"
        className="nhsuk-heading-m nhsuk-u-margin-top-6"
      >
        {content.heading}
      </h2>
      <p className="nhsuk-body">
        {`${content.fullCheckPrefix} `}
        <OpensInNewTabLink linkHref="#" linkText={fullCheckLinkText} />.
      </p>
      <p className="nhsuk-body">
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/medicines/pre-exposure-prophylaxis-prep/about-pre-exposure-prophylaxis-prep/"
          linkText={content.prepLink}
        />{" "}
        {`${content.prepAdvice} `}
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/nhs-services/sexual-health-services/find-a-sexual-health-clinic/"
          linkText={content.clinicLink}
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
