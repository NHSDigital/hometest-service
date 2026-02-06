"use client";

import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";
import { useContent } from "@/hooks";
import { JourneyStepNames } from "@/lib/models/route-paths";
import PageLayout from "@/layouts/PageLayout";

export default function NoAddressFoundPage() {
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();
  const { orderAnswers } = useCreateOrderContext();
  const { "no-address-found": content } = useContent();

  return (
    <PageLayout
      showBackButton
      onBackButtonClick={() => {
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep(JourneyStepNames.EnterDeliveryAddress);
        }
      }}
    >
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">
        {content.title}
      </h1>
      <p>
        {content.notFoundMessage}{" "}
        <strong>{orderAnswers.postcodeSearch}</strong>
        {orderAnswers.buildingNumber && (
          <>
            {" "}
            and <strong>{orderAnswers.buildingNumber}</strong>
          </>
        )}
        .
      </p>

      <p className="nhsuk-body">
        <a onClick={() => goToStep(JourneyStepNames.EnterDeliveryAddress)}>
          {content.tryNewSearchLink}
        </a>
      </p>

      <p className="nhsuk-body">
        <a onClick={() => goToStep(JourneyStepNames.EnterAddressManually)}>
          {content.enterAddressManuallyLink}
        </a>
      </p>
    </PageLayout>
  );
}
