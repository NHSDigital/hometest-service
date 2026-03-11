import { OpensInNewTabLink } from "@/components/OpensInNewTabLink";
import { useCommonContent } from "@/hooks";

export function FeedbackSection() {
  const commonContent = useCommonContent();

  return (
    <div
      className="nhsuk-grid-row nhsuk-u-padding-top-4 nhsuk-u-padding-bottom-4"
      style={{ backgroundColor: "#D2E1EF" }}
    >
      <div className="nhsuk-grid-column-full">
        <p className="nhsuk-u-margin-bottom-0">
          {`${commonContent.feedback.text} `}
          <OpensInNewTabLink
            linkHref={commonContent.feedback.linkHref}
            linkText={commonContent.feedback.linkText}
          />
          .
        </p>
      </div>
    </div>
  );
}
