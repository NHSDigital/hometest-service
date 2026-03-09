"use client";

import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";

import { FeedbackSection } from "@/components/FeedbackSection";
import { FindAnotherSexualHealthClinicLink } from "@/components/FindAnotherSexualHealthClinicLink";
import FormPageLayout from "@/layouts/FormPageLayout";
import { JourneyStepNames } from "@/lib/models/route-paths";
import { LearnMoreAboutHivAndAidsLink } from "@/components/LearnMoreAboutHivAndAidsLink";
import { NearestSexualHealthClinicSection } from "@/components/NearestSexualHealthClinicSection";
import { usePageContent } from "@/hooks";

export default function KitNotAvailableInAreaPage() {
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();
  const { orderAnswers } = useCreateOrderContext();
  const content = usePageContent("kit-not-available-in-area");

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
      <p className="nhsuk-body">{content.description}</p>

      <NearestSexualHealthClinicSection />
      <hr className="nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5" />
      <FindAnotherSexualHealthClinicLink postcodeSearch={orderAnswers.postcodeSearch} />
      <h2>{content.moreOptionsHeading}</h2>
      <LearnMoreAboutHivAndAidsLink />
      <FeedbackSection />
    </FormPageLayout>
  );
}
