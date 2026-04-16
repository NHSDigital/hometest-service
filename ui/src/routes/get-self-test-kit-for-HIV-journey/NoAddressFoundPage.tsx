"use client";

import { useContent } from "@/hooks";
import FormPageLayout from "@/layouts/FormPageLayout";
import { JourneyStepNames } from "@/lib/models/route-paths";
import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";

export default function NoAddressFoundPage() {
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();
  const { orderAnswers } = useCreateOrderContext();
  const { commonContent, "no-address-found": content } = useContent();

  return (
    <FormPageLayout
      showBackButton
      onBackButtonClick={() => {
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep(JourneyStepNames.EnterDeliveryAddress);
        }
      }}
    >
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">{content.title}</h1>
      <p>
        {content.notFoundMessage} <strong>{orderAnswers.postcodeSearch}</strong>
        {orderAnswers.buildingNumber && (
          <>
            {" "}
            and <strong>{orderAnswers.buildingNumber}</strong>
          </>
        )}
        .
      </p>

      <p className="nhsuk-body">
        <a
          href="enter-delivery-address"
          onClick={(e) => {
            e.preventDefault();
            goToStep(JourneyStepNames.EnterDeliveryAddress);
          }}
        >
          {content.tryNewSearchLink}
        </a>
      </p>

      <p className="nhsuk-body">
        <a
          href="enter-address-manually"
          onClick={(e) => {
            e.preventDefault();
            goToStep(JourneyStepNames.EnterAddressManually);
          }}
        >
          {commonContent.navigation.manualEntryLink}
        </a>
      </p>
    </FormPageLayout>
  );
}
