"use client";

import { Button, ErrorSummary, TextInput } from "nhsuk-react-components";
import { useEffect, useRef, useState } from "react";

import { useAsyncErrorHandler, useContent } from "@/hooks";
import FormPageLayout from "@/layouts/FormPageLayout";
import { JourneyStepNames, RoutePath } from "@/lib/models/route-paths";
import { createBuildingNameSchema, createPostcodeSchema } from "@/lib/validation/address-schema";
import { useCreateOrderContext, useJourneyNavigationContext, usePostcodeLookup } from "@/state";

export default function EnterDeliveryAddressPage() {
  const { orderAnswers, updateOrderAnswers } = useCreateOrderContext();
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();
  const { lookupPostcode, lookupResultsStatus, isLoading, clearAddresses } = usePostcodeLookup();
  const { commonContent, "enter-delivery-address": content } = useContent();

  const [postcode, setPostcode] = useState(orderAnswers.postcodeSearch || "");
  const [buildingName, setBuildingName] = useState(orderAnswers.buildingNumber || "");
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const [buildingNameError, setBuildingNameError] = useState<string | null>(null);

  const hasSubmittedRef = useRef(false);

  const postcodeSchema = createPostcodeSchema(commonContent.validation);
  const buildingNameSchema = createBuildingNameSchema(commonContent.validation);

  useEffect(() => {
    clearAddresses();
  }, [clearAddresses]);

  useEffect(() => {
    if (hasSubmittedRef.current && !isLoading && lookupResultsStatus !== "idle") {
      hasSubmittedRef.current = false;
      switch (lookupResultsStatus) {
        case "not_found":
          goToStep(JourneyStepNames.NoAddressFound);
          break;
        case "found":
          goToStep(JourneyStepNames.SelectDeliveryAddress);
          break;
        case "error":
          console.error("Postcode lookup failed");
          throw new Error("Postcode lookup failed");
      }
    }
  }, [lookupResultsStatus, isLoading, goToStep]);

  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostcode(e.target.value);
  };

  const handleBuildingNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuildingName(e.target.value);
  };

  const handleSubmit = useAsyncErrorHandler(async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const postcodeValidation = postcodeSchema.safeParse(postcode);
    const buildingNameValidation = buildingNameSchema.safeParse(buildingName);

    setPostcodeError(
      postcodeValidation.success ? null : postcodeValidation.error.issues[0].message,
    );
    setBuildingNameError(
      buildingNameValidation.success ? null : buildingNameValidation.error.issues[0].message,
    );

    if (postcodeValidation.success && buildingNameValidation.success) {
      const updatedData = {
        postcodeSearch: postcodeValidation.data,
        buildingNumber: buildingName.trim() || undefined,
      };
      updateOrderAnswers(updatedData);

      hasSubmittedRef.current = true;
      await lookupPostcode(updatedData.postcodeSearch);
    }
  });

  return (
    <FormPageLayout
      showBackButton
      onBackButtonClick={() => {
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep(RoutePath.BeforeYouStartPage);
        }
      }}
    >
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">{content.title}</h1>

      {(postcodeError || buildingNameError) && (
        <ErrorSummary aria-labelledby="error-summary-title" role="alert">
          <ErrorSummary.Title id="error-summary-title">
            {commonContent.errorSummary.title}
          </ErrorSummary.Title>
          <ErrorSummary.List>
            {postcodeError && (
              <ErrorSummary.ListItem
                href="#postcode"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("postcode")?.focus();
                }}
              >
                {postcodeError}
              </ErrorSummary.ListItem>
            )}
            {buildingNameError && (
              <ErrorSummary.ListItem
                href="#building-number-or-name"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("building-number-or-name")?.focus();
                }}
              >
                {buildingNameError}
              </ErrorSummary.ListItem>
            )}
          </ErrorSummary.List>
        </ErrorSummary>
      )}

      <form onSubmit={handleSubmit}>
        <TextInput
          id="postcode"
          name="postcode"
          label={content.form.postcodeLabel}
          labelProps={{
            isPageHeading: false,
            size: "s",
          }}
          hint={content.form.postcodeHint}
          value={postcode}
          onChange={handlePostcodeChange}
          error={postcodeError || undefined}
        ></TextInput>

        <TextInput
          id="building-number-or-name"
          name="building-number-or-name"
          label={content.form.buildingNameLabel}
          labelProps={{
            isPageHeading: false,
            size: "s",
          }}
          hint={content.form.buildingNameHint}
          value={buildingName}
          onChange={handleBuildingNameChange}
          error={buildingNameError || undefined}
        ></TextInput>

        <Button type="submit">{commonContent.navigation.continue}</Button>
      </form>

      <p className="nhsuk-body">
        <a
          href={JourneyStepNames.EnterAddressManually}
          onClick={(e) => {
            e.preventDefault();
            updateOrderAnswers({
              postcodeSearch: undefined,
              buildingNumber: undefined,
            });
            goToStep(JourneyStepNames.EnterAddressManually);
          }}
        >
          {commonContent.navigation.manualEntryLink}
        </a>
      </p>
    </FormPageLayout>
  );
}
