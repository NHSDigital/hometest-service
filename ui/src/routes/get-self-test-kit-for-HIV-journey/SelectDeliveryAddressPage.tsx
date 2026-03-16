"use client";

import {
  AddressResult,
  useAuth,
  useCreateOrderContext,
  useJourneyNavigationContext,
  usePostcodeLookup,
} from "@/state";
import FormPageLayout from "@/layouts/FormPageLayout";
import { useContent, useAsyncErrorHandler } from "@/hooks";
import { Radios, Button, ErrorSummary } from "nhsuk-react-components";
import { JourneyStepNames } from "@/lib/models/route-paths";
import laLookupService from "@/lib/services/la-lookup-service";
import { useState } from "react";
import { isUnder18 } from "@/lib/utils/is-under-18";

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
  const { user } = useAuth();

  const isUnder18User = user ? isUnder18(user.birthdate) : false;

  const handleSubmit = useAsyncErrorHandler(async (e: React.SyntheticEvent<HTMLFormElement>) => {
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

    const postcode = selected.postcode;
    const laResponse = await laLookupService.getByPostcode(postcode);
    if (!laResponse || !laResponse.suppliers || laResponse.suppliers.length === 0) {
      updateOrderAnswers({ postcodeSearch: postcode });
      goToStep(JourneyStepNames.KitNotAvailableInArea);
      return;
    }
    updateOrderAnswers({
      deliveryAddress: {
        addressLine1: selected.line1,
        addressLine2: selected.line2,
        addressLine3: selected.line3,
        addressLine4: selected.line4,
        postTown: selected.town,
        postcode: postcode,
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

    if (!postcode) {
      throw new Error("Postcode is required for address selection.");
    }

    if (isUnder18User) {
      goToStep(JourneyStepNames.CannotUseServiceUnder18);

      return;
    }

    if (returnToStep) {
      const step = returnToStep;
      setReturnToStep(null);
      goToStep(step);
    } else {
      goToStep(JourneyStepNames.HowComfortablePrickingFinger);
    }
  });

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAddress(e.target.value);
  };

  return (
    <FormPageLayout
      showBackButton
      onBackButtonClick={() => {
        updateOrderAnswers({
          postcodeSearch: undefined,
          buildingNumber: undefined,
        });
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep(JourneyStepNames.EnterDeliveryAddress);
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
          <ErrorSummary.List>
            <ErrorSummary.ListItem
              href="#collection-point"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("collection-point-1")?.focus();
              }}
            >
              {addressError}
            </ErrorSummary.ListItem>
          </ErrorSummary.List>
        </ErrorSummary>
      )}

      <form onSubmit={handleSubmit}>
        <Radios
          id="collection-point"
          name="collection-point"
          legend={content.formLabel}
          legendProps={{
            isPageHeading: false,
            size: "s",
          }}
          error={addressError || undefined}
          onChange={handleRadioChange}
        >
          {addresses.map((address) => (
            <Radios.Item
              key={address.id}
              value={address.id}
              checked={selectedAddress === address.id}
            >
              {address.fullAddress}
            </Radios.Item>
          ))}
        </Radios>

        <Button type="submit">{commonContent.navigation.continue}</Button>
      </form>

      <p className="nhsuk-body">
        <a
          href={JourneyStepNames.EnterAddressManually}
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
