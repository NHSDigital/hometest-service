"use client";

import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";

import { FeedbackSection } from "@/components/FeedbackSection";
import { FindAnotherSexualHealthClinicLink } from "@/components/FindAnotherSexualHealthClinicLink";
import { LearnMoreAboutHivAndAidsLink } from "@/components/LearnMoreAboutHivAndAidsLink";
import { NearestSexualHealthClinicSection } from "@/components/NearestSexualHealthClinicSection";
import PageLayout from "@/layouts/PageLayout";
import { usePageContent } from "@/hooks";

export default function KitNotAvailableInAreaPage() {
  const { goBack } = useJourneyNavigationContext();
  const { orderAnswers } = useCreateOrderContext();
  const content = usePageContent("kit-not-available-in-area");

  return (
    <PageLayout showBackButton onBackButtonClick={goBack}>
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">{content.title}</h1>
      <p className="nhsuk-body">{content.description}</p>

      <NearestSexualHealthClinicSection />
      <hr className="nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5" />
      <FindAnotherSexualHealthClinicLink postcodeSearch={orderAnswers.postcodeSearch} />
      <h2>{content.moreOptionsHeading}</h2>
      <LearnMoreAboutHivAndAidsLink />
      <FeedbackSection />
    </PageLayout>
  );
}
