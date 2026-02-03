"use client";

import { PageLayout } from "@/components/PageLayout";
import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";
import Link from "next/link";


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
          goToStep("enter-delivery-address");
        }
      }}>
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">No address found</h1>
      <p>
        We could not find an address that matches <strong>{orderAnswers.postcodeSearch}</strong>{orderAnswers.buildingNumber && <> and <strong>{orderAnswers.buildingNumber}</strong></>}.
      </p>

      <p className="nhsuk-body">
        <Link
          href="enter-delivery-address"
          onClick={() => goToStep("enter-delivery-address")}
        >
          Try a new search
        </Link>
      </p>

      <p className="nhsuk-body">
        <Link
          href="enter-address-manually"
          onClick={() => goToStep("enter-address-manually")}
        >
          Enter address manually
        </Link>
      </p>
    </PageLayout>
  );
}
