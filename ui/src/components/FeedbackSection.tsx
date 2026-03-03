import { useCommonContent } from "@/hooks";

export function FeedbackSection() {
  const commonContent = useCommonContent();

  return (
    <div
      className="nhsuk-grid-row nhsuk-u-margin-bottom-0 nhsuk-u-margin-top-6 nhsuk-u-padding-top-4"
      style={{ backgroundColor: "#D2E1EF" }}
    >
      <div className="nhsuk-grid-column-full flex-center-container">
        <p>
          {`${commonContent.feedback.text} `}
          <a href={commonContent.feedback.linkHref}>{commonContent.feedback.linkText}</a>.
        </p>
      </div>
    </div>
  );
}
