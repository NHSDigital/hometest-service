import { useCommonContent } from "@/hooks";

export function ReadyStatus() {
  const commonContent = useCommonContent();
  const content = commonContent.orderStatus.statuses.ready;

  return (
    <>
      <h2 className="nhsuk-heading-m">{content.heading}</h2>
      <p>
        <a href="#" className="nhsuk-link" aria-label={content.viewResultLink}>
          {content.viewResultLink}
        </a>
      </p>
      <hr />
    </>
  );
}
