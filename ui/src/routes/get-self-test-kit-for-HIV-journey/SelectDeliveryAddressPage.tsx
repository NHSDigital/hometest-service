"use client";

import { useState } from "react";
import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";
import { useContent } from "@/hooks";
import { Radios, Button, ErrorSummary } from "nhsuk-react-components";
import mockAddressResponse from "@/mocks/addressLookupResponse.json";
import PageLayout from "@/layouts/PageLayout";
import { JourneyStepNames } from "@/lib/models/route-paths";

interface AddressResult {
  DPA: {
    UPRN: string;
    ADDRESS: string;
    BUILDING_NAME?: string;
    BUILDING_NUMBER?: string;
    THOROUGHFARE_NAME?: string;
    DEPENDENT_LOCALITY?: string;
    POST_TOWN: string;
    POSTCODE: string;
  };
}

export default function SelectDeliveryAddressPage() {
  const { goToStep, goBack, stepHistory, returnToStep, setReturnToStep } = useJourneyNavigationContext();
  const { orderAnswers, updateOrderAnswers } = useCreateOrderContext();
  const { commonContent, "select-delivery-address": content } = useContent();

  const [selectedAddress, setSelectedAddress] = useState<string>(orderAnswers.selectedAddressUPRN || "");
  const [addressError, setAddressError] = useState<string | null>(null);

  const addresses = mockAddressResponse.results as AddressResult[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddress || selectedAddress.trim() === "") {
      setAddressError(commonContent.validation.deliveryAddress.required);
      return;
    }

    setAddressError(null);

    const selected = addresses.find((addr) => addr.DPA.UPRN === selectedAddress);
    if (selected) {
      const addressLines = [];

      if (selected.DPA.BUILDING_NAME) {
        addressLines.push(selected.DPA.BUILDING_NAME);
      }
      if (selected.DPA.BUILDING_NUMBER) {
        addressLines.push(selected.DPA.BUILDING_NUMBER);
      }
      if (selected.DPA.THOROUGHFARE_NAME) {
        addressLines.push(selected.DPA.THOROUGHFARE_NAME);
      }

      updateOrderAnswers({
        deliveryAddress: {
          addressLine1: addressLines[0],
          addressLine2: addressLines[1],
          addressLine3: selected.DPA.DEPENDENT_LOCALITY,
          postTown: selected.DPA.POST_TOWN,
          postcode: selected.DPA.POSTCODE,
        },
        addressEntryMethod: 'postcode-search',
        selectedAddressUPRN: selected.DPA.UPRN,
      });

      if (returnToStep) {
        const step = returnToStep;
        setReturnToStep(null);
        goToStep(step);
      } else {
        goToStep("how-comfortable-pricking-finger");
      }
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
          buildingNumber: undefined
        });
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep("enter-delivery-address");
        }
      }}>
        <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">
          {addresses.length} {addresses.length === 1 ? 'address' : 'addresses'} {content.title}
        </h1>
        <p>{content.postcodeLabel} <strong>{orderAnswers.postcodeSearch} </strong>
          <a href="enter-delivery-address" onClick={(e) => {
            e.preventDefault();
            goToStep(JourneyStepNames.EnterDeliveryAddress);
          }}>
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
                    document.getElementById('collection-point-1')?.focus();
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
                key={address.DPA.UPRN} 
                value={address.DPA.UPRN}
                checked={selectedAddress === address.DPA.UPRN}
              >
                {address.DPA.ADDRESS}
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
              updateOrderAnswers({
                postcodeSearch: undefined,
                buildingNumber: undefined
              });
              goToStep("enter-address-manually");
            }}
          >
            {commonContent.navigation.manualEntryLink}
          </a>
        </p>
    </PageLayout>
  );
}
