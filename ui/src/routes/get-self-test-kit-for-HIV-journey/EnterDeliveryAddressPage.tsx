"use client";

import { Button, ErrorSummary, TextInput } from "nhsuk-react-components";
import { useCreateOrderContext, useJourneyNavigationContext, usePostcodeLookup } from "@/state";
import { useContent } from "@/hooks";
import type { ValidationMessages } from "@/content/schema";
import { JourneyStepNames } from "@/lib/models/route-paths";
import PageLayout from "@/layouts/PageLayout";
import { useEffect, useRef, useState } from "react";

const POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
const MAX_POSTCODE_LENGTH = 8;
const MAX_BUILDING_NAME_LENGTH = 100;

// Validation functions
const validatePostcode = (
  postcode: string,
  validationMessages: ValidationMessages,
): { valid: true; value: string } | { valid: false; message: string } => {
  if (!postcode || postcode.trim() === "") {
    return { valid: false, message: validationMessages.postcode.required };
  }

  if (postcode.length > MAX_POSTCODE_LENGTH) {
    return { valid: false, message: validationMessages.postcode.maxLength };
  }

  const normalizedPostcode = postcode.trim().toUpperCase();

  if (!POSTCODE_REGEX.test(normalizedPostcode)) {
    return { valid: false, message: validationMessages.postcode.invalid };
  }

  return { valid: true, value: normalizedPostcode };
};

const validateBuildingName = (
  buildingName: string,
  validationMessages: ValidationMessages,
): string | null => {
  if (!buildingName || buildingName.trim() === "") {
    return null;
  }

  if (buildingName.length > MAX_BUILDING_NAME_LENGTH) {
    return validationMessages.buildingName.maxLength;
  }

  return null;
};

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

  useEffect(() => {
    clearAddresses();
  }, [clearAddresses]);

  useEffect(() => {
    if (hasSubmittedRef.current && !isLoading && lookupResultsStatus !== "idle") {
      hasSubmittedRef.current = false;
      switch (lookupResultsStatus) {
        case "not_found":
          goToStep("no-address-found");
          break;
        case "found":
          goToStep("select-delivery-address");
          break;
        case "error":
          console.error("Postcode lookup failed");
          break;
      }
    }
  }, [lookupResultsStatus, isLoading, goToStep]);

  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostcode(e.target.value);
  };

  const handleBuildingNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuildingName(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const postcodeValidation = validatePostcode(postcode, commonContent.validation);
    const buildingNameValidationError = validateBuildingName(
      buildingName,
      commonContent.validation,
    );

    setPostcodeError(postcodeValidation.valid ? null : postcodeValidation.message);
    setBuildingNameError(buildingNameValidationError);

    if (postcodeValidation.valid && !buildingNameValidationError) {
      const updatedData = {
        postcodeSearch: postcodeValidation.value,
        buildingNumber: buildingName.trim() || undefined,
      };
      updateOrderAnswers(updatedData);

      hasSubmittedRef.current = true;
      await lookupPostcode(updatedData.postcodeSearch);
    }
  };

  return (
    <PageLayout
      showBackButton
      onBackButtonClick={() => {
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep("get-self-test-kit-for-HIV");
        }
      }}
    >
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">{content.title}</h1>

      {(postcodeError || buildingNameError) && (
        <ErrorSummary aria-labelledby="error-summary-title" role="alert">
          <ErrorSummary.Title id="error-summary-title">
            {commonContent.errorSummary.title}
          </ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {postcodeError && (
                <ErrorSummary.Item
                  href="#postcode"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("postcode")?.focus();
                  }}
                >
                  {postcodeError}
                </ErrorSummary.Item>
              )}
              {buildingNameError && (
                <ErrorSummary.Item
                  href="#building-number-or-name"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("building-number-or-name")?.focus();
                  }}
                >
                  {buildingNameError}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
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
          href="enter-address-manually"
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
    </PageLayout>
  );
}
