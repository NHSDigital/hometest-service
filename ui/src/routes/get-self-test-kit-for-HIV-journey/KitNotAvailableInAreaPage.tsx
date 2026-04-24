"use client";

import { FeedbackSection } from "@/components/FeedbackSection";
import { FindAnotherSexualHealthClinicLink } from "@/components/FindAnotherSexualHealthClinicLink";
import { LearnMoreAboutHivAndAidsLink } from "@/components/LearnMoreAboutHivAndAidsLink";
import { NearestSexualHealthClinicSection } from "@/components/NearestSexualHealthClinicSection";
import { usePageContent, usePageTitle } from "@/hooks";
import FormPageLayout from "@/layouts/FormPageLayout";
import { JourneyStepNames } from "@/lib/models/route-paths";
import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";

export default function KitNotAvailableInAreaPage() {
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();
  const { orderAnswers } = useCreateOrderContext();
  const content = usePageContent("kit-not-available-in-area");
  usePageTitle(content.pageTitle);

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
