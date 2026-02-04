"use client";

import { PageLayout } from "@/components/PageLayout";
import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";
import { useContent } from "@/hooks";
import Link from "next/link";


export default function NoAddressFoundPage() {
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();
  const { orderAnswers } = useCreateOrderContext();
  const { commonContent, "no-address-found": content } = useContent();

  return (
    <PageLayout
      showBackButton
      onBackButtonClick={() => {
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep("enter-delivery-address");
        }
      }}>
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">{content.title}</h1>
      <p>
        {content.notFoundMessage} <strong>{orderAnswers.postcodeSearch}</strong>{orderAnswers.buildingNumber && <> and <strong>{orderAnswers.buildingNumber}</strong></>}.
      </p>

      <p className="nhsuk-body">
        <Link
          href="enter-delivery-address"
          onClick={() => goToStep("enter-delivery-address")}
        >
          {content.tryNewSearchLink}
        </Link>
      </p>

      <p className="nhsuk-body">
        <Link
          href="enter-address-manually"
          onClick={() => goToStep("enter-address-manually")}
        >
          {commonContent.navigation.manualEntryLink}
        </Link>
      </p>
    </PageLayout>
  );
}
