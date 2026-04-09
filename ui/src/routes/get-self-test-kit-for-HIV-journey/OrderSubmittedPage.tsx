"use client";

import { useLayoutEffect } from "react";

import { useContent } from "@/hooks";
import FormPageLayout from "@/layouts/FormPageLayout";
import { RoutePath } from "@/lib/models/route-paths";
import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";

export default function OrderSubmittedPage() {
  const { orderAnswers } = useCreateOrderContext();
  const { resetNavigation } = useJourneyNavigationContext();
  const { "order-submitted": content } = useContent();

  useLayoutEffect(() => {
    if (orderAnswers.orderReferenceNumber == null) {
      resetNavigation(RoutePath.GetSelfTestKitPage, { replace: true });
    }
  }, [orderAnswers.orderReferenceNumber, resetNavigation]);

  const referenceNumber = orderAnswers.orderReferenceNumber ?? "[Reference Number]";
  const supplierName = orderAnswers.supplier?.[0]?.name || "[Supplier]";

  // TODO: update feedback HREF in content

  return (
    <FormPageLayout showBackButton={false}>
      <div className="nhsuk-panel nhsuk-panel--confirmation">
        <h1 className="nhsuk-panel__title">{content.panel.title}</h1>
        <div className="nhsuk-panel__body" id="reference-number">
          {content.panel.referenceNumberPrefix} {referenceNumber}
        </div>
      </div>

      <h2 className="nhsuk-heading-m">{content.whatHappensNext.heading}</h2>
      <ul className="nhsuk-list nhsuk-list--bullet">
        <li>{content.whatHappensNext.steps[0].replace("{supplier}", supplierName)}</li>
        <li>{content.whatHappensNext.steps[1]}</li>
        <li>{content.whatHappensNext.steps[2]}</li>
        <li>{content.whatHappensNext.steps[3]}</li>
      </ul>

      <div
        className="nhsuk-grid-row nhsuk-u-margin-bottom-0 nhsuk-u-margin-top-6 nhsuk-u-padding-top-4"
        style={{ backgroundColor: "#D2E1EF" }}
      >
        <div className="nhsuk-grid-column-full flex-center-container">
          <p>
            {content.feedback.text}{" "}
            <a href={content.feedback.linkHref}>{content.feedback.linkText}</a>.
          </p>
        </div>
      </div>
    </FormPageLayout>
  );
}
