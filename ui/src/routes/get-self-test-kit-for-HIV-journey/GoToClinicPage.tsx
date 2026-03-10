"use client";

import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";

import { FeedbackSection } from "@/components/FeedbackSection";
import { FindAnotherSexualHealthClinicLink } from "@/components/FindAnotherSexualHealthClinicLink";
import { JourneyStepNames } from "@/lib/models/route-paths";
import { LearnMoreAboutHivAndAidsLink } from "@/components/LearnMoreAboutHivAndAidsLink";
import { NearestSexualHealthClinicSection } from "@/components/NearestSexualHealthClinicSection";
import { usePageContent } from "@/hooks";
import FormPageLayout from "@/layouts/FormPageLayout";

export default function GoToClinicPage() {
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();
  const { orderAnswers } = useCreateOrderContext();
  const content = usePageContent("go-to-clinic");

  return (
    <FormPageLayout
      showBackButton
      onBackButtonClick={() => {
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep(JourneyStepNames.HowComfortablePrickingFinger);
        }
      }}
    >
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">{content.title}</h1>

      <NearestSexualHealthClinicSection
        showTitle={false}
      />
      <hr className="nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5" />
      <FindAnotherSexualHealthClinicLink postcodeSearch={orderAnswers.postcodeSearch} />
      <h2>{content.moreOptionsHeading}</h2>
      <LearnMoreAboutHivAndAidsLink />
      <FeedbackSection />
    </FormPageLayout>
  );
}
