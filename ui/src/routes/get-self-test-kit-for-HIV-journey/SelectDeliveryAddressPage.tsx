"use client";

import {
  AddressResult,
  useCreateOrderContext,
  useJourneyNavigationContext,
  usePostcodeLookup,
} from "@/state";
import { Button, ErrorSummary, Radios } from "nhsuk-react-components";

import { JourneyStepNames } from "@/lib/models/route-paths";
import PageLayout from "@/layouts/PageLayout";
import laLookupService from "@/lib/services/la-lookup-service";
import { useContent } from "@/hooks";
import { useState } from "react";

export default function SelectDeliveryAddressPage() {
  const { goToStep, goBack, stepHistory, returnToStep, setReturnToStep } =
    useJourneyNavigationContext();
  const { orderAnswers, updateOrderAnswers } = useCreateOrderContext();
  const { commonContent, "select-delivery-address": content } = useContent();
  const { addresses } = usePostcodeLookup();
  const [selectedAddress, setSelectedAddress] = useState<string>(
    orderAnswers.selectedAddressId || "",
  );
  const [addressError, setAddressError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddress || selectedAddress.trim() === "") {
      setAddressError(commonContent.validation.deliveryAddress.required);
      return;
    }

    setAddressError(null);

    const selected: AddressResult | undefined = addresses.find(
      (addr) => addr.id === selectedAddress,
    );
    if (!selected) return;

    try {
      const postcode = orderAnswers.postcodeSearch;

      if (!postcode) {
        console.error("[SelectDeliveryAddressPage] Missing postcode in journey context.");

        // ALPHA: ToDo error screen thrown here:
        return null;
      }

      const laResponse = await laLookupService.getByPostcode(postcode);

      if (!laResponse || !laResponse.suppliers || laResponse.suppliers.length === 0) {
        goToStep(JourneyStepNames.KitNotAvailableInArea);
        return null;
      }
      console.log("Eligibility lookup response:", laResponse);

      updateOrderAnswers({
        deliveryAddress: {
          addressLine1: selected.line1,
          addressLine2: selected.line2,
          addressLine3: selected.line3,
          postTown: selected.town,
          postcode: selected.postcode,
        },
        addressEntryMethod: "postcode-search",
        selectedAddressId: selected.id,
        localAuthority: {
          code: laResponse.localAuthority.localAuthorityCode,
          region: laResponse.localAuthority.region,
        },
        supplier: laResponse.suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          testCode: supplier.testCode,
        })),
      });

      if (returnToStep) {
        const step = returnToStep;
        setReturnToStep(null);
        goToStep(step);
      } else {
        goToStep("how-comfortable-pricking-finger");
      }
    } catch (err) {
      // ALPHA: Remove the console log and use proper logging pattern
      console.error("Failed to lookup local authority:", err);
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAddress(e.target.value);
  };

  return (
    <PageLayout
      showBackButton
      onBackButtonClick={() => {
        updateOrderAnswers({
          postcodeSearch: undefined,
          buildingNumber: undefined,
        });
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep("enter-delivery-address");
        }
      }}
    >
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">
        {addresses.length} {addresses.length === 1 ? "address" : "addresses"} {content.title}
      </h1>
      <p id="postcode-search--paragraph">
        {content.postcodeLabel}{" "}
        <strong id="postcode-search--strong">{orderAnswers.postcodeSearch} </strong>
        <a
          href="enter-delivery-address"
          onClick={(e) => {
            e.preventDefault();
            goToStep(JourneyStepNames.EnterDeliveryAddress);
          }}
        >
          {content.editPostcodeLink}
        </a>
      </p>

      {addressError && (
        <ErrorSummary aria-labelledby="error-summary-title" role="alert">
          <ErrorSummary.Title id="error-summary-title">
            {commonContent.errorSummary.title}
          </ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item
                href="#collection-point"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("collection-point-1")?.focus();
                }}
              >
                {addressError}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}

      <form onSubmit={handleSubmit}>
        <Radios
          id="collection-point"
          name="collection-point"
          label={content.formLabel}
          labelProps={{
            isPageHeading: false,
            size: "s",
          }}
          error={addressError || undefined}
          onChange={handleRadioChange}
        >
          {addresses.map((address) => (
            <Radios.Radio
              key={address.id}
              value={address.id}
              checked={selectedAddress === address.id}
            >
              {address.fullAddress}
            </Radios.Radio>
          ))}
        </Radios>

        <Button type="submit">{commonContent.navigation.continue}</Button>
      </form>

      <p className="nhsuk-body">
        <a
          href="enter-address-manually"
          onClick={(e) => {
            e.preventDefault();
            goToStep(JourneyStepNames.EnterDeliveryAddress);
          }}
        >
          {commonContent.navigation.manualEntryLink}
        </a>
      </p>
    </PageLayout>
  );
}
