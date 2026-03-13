import { LearnMoreAboutHivAndAidsLink } from "@/components/LearnMoreAboutHivAndAidsLink";
import { useCommonContent } from "@/hooks";

export function MoreInformationLinks() {
  const commonContent = useCommonContent();
  const content = commonContent.orderStatus.moreInformation;

  return (
    <section aria-labelledby="more-info-heading">
      <h2 id="more-info-heading" className="nhsuk-heading-m">
        {content.heading}
      </h2>
      <LearnMoreAboutHivAndAidsLink />
    </section>
  );
}
