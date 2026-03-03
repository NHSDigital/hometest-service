import { OpensInNewTabLink } from "@/components/OpensInNewTabLink";
import { usePageContent } from "@/hooks";

export function MedicalAbbreviationsHelp() {
  const content = usePageContent("test-results").medicalAbbreviationsHelp;

  return (
    <>
      <p className="nhsuk-body nhsuk-u-margin-top-5">{content.intro}</p>
      <p className="nhsuk-body">
        <OpensInNewTabLink
          linkHref="https://www.nhs.uk/nhs-app/help/health-records-in-the-nhs-app/abbreviations-commonly-found-in-medical-records/"
          linkText={content.linkText}
        />
      </p>
    </>
  );
}
