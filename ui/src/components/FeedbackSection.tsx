import { OpensInNewTabLink } from "./OpensInNewTabLink";
import { useCommonContent } from "@/hooks";

export function FeedbackSection() {
  const commonContent = useCommonContent();

  return (
    <div
      className="nhsuk-grid-row nhsuk-u-margin-bottom-0 nhsuk-u-margin-top-6 nhsuk-u-padding-top-4"
      style={{ backgroundColor: "#D2E1EF" }}
    >
      <div className="nhsuk-grid-column-full">
        <p>
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
