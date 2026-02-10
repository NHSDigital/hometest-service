import { useCommonContent } from "@/hooks";

export function MoreInformationLinks() {
  const commonContent = useCommonContent();
  const content = commonContent.orderStatus.moreInformation;

  return (
    <section aria-labelledby="more-info-heading">
      <h2 id="more-info-heading" className="nhsuk-heading-m">
        {content.heading}
      </h2>
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
