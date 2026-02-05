"use client";

import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";
import { useContent } from "@/hooks";
import Link from "next/link";
import PageLayout from "@/layouts/PageLayout";


export default function NoAddressFoundPage() {
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();
  const { orderAnswers, updateOrderAnswers } = useCreateOrderContext();
  const { commonContent, "no-address-found": content } = useContent();

  return (
    <PageLayout
      showBackButton
      onBackButtonClick={() => {
        updateOrderAnswers({
          postcodeSearch: undefined,
          buildingNumber: undefined
        });
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
          onClick={() => {
            updateOrderAnswers({
              postcodeSearch: undefined,
              buildingNumber: undefined
            });
            goToStep("enter-delivery-address");
          }}
        >
          {content.tryNewSearchLink}
        </Link>
      </p>

      <p className="nhsuk-body">
        <Link
          href="enter-address-manually"
          onClick={() => {
            updateOrderAnswers({
              postcodeSearch: undefined,
              buildingNumber: undefined
            });
            goToStep("enter-address-manually");
          }}
        >
          {commonContent.navigation.manualEntryLink}
        </Link>
      </p>
    </PageLayout>
  );
}
