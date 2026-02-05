"use client";

import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";
import { JourneyStepNames } from "@/lib/models/route-paths";
import PageLayout from "@/layouts/PageLayout";

export default function NoAddressFoundPage() {
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();
  const { orderAnswers } = useCreateOrderContext();

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
        No address found
      </h1>
      <p>
        We could not find an address that matches{" "}
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
        <a href="enter-delivery-address" onClick={(e) => {e.preventDefault(); goToStep(JourneyStepNames.EnterDeliveryAddress);}}>
          Try a new search
        </a>
      </p>

      <p className="nhsuk-body">
        <a href="enter-address-manually" onClick={(e) => {e.preventDefault(); goToStep(JourneyStepNames.EnterAddressManually);}}>
          Enter address manually
        </a>
      </p>
    </PageLayout>
  );
}
