"use client";

import { Button, ErrorSummary, TextInput } from "nhsuk-react-components";
import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";

import { JourneyStepNames } from "@/lib/models/route-paths";
import PageLayout from "@/layouts/PageLayout";
import { useState } from "react";

// TODO: update redirect logic if user has selected manual address entry (use goToStep)
// TODO: add postcode lookup integration

const POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
const MAX_POSTCODE_LENGTH = 8;
const MAX_BUILDING_NAME_LENGTH = 100;

// Validation functions
const validatePostcode = (
  postcode: string,
): { valid: true; value: string } | { valid: false; message: string } => {
  if (!postcode || postcode.trim() === "") {
    return { valid: false, message: "Enter a full UK postcode" };
  }

  if (postcode.length > MAX_POSTCODE_LENGTH) {
    return { valid: false, message: "Postcode must be 8 characters or less" };
  }

  const normalizedPostcode = postcode.trim().toUpperCase();

  if (!POSTCODE_REGEX.test(normalizedPostcode)) {
    return {
      valid: false,
      message: "Enter a postcode using letters and numbers",
    };
  }

  return { valid: true, value: normalizedPostcode };
};

const validateBuildingName = (buildingName: string): string | null => {
  if (!buildingName || buildingName.trim() === "") {
    return null;
  }

  if (buildingName.length > MAX_BUILDING_NAME_LENGTH) {
    return "Building number or name must be 100 characters or less";
  }

  return null;
};

export default function EnterDeliveryAddressPage() {
  const { orderAnswers, updateOrderAnswers } = useCreateOrderContext();
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();

  const [postcode, setPostcode] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const [buildingNameError, setBuildingNameError] = useState<string | null>(
    null,
  );

  console.log("[EnterDeliveryAddressPage] Current order state:", orderAnswers);

  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostcode(e.target.value);
  };

  const handleBuildingNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuildingName(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const postcodeValidation = validatePostcode(postcode);
    const buildingNameValidationError = validateBuildingName(buildingName);

    setPostcodeError(
      postcodeValidation.valid ? null : postcodeValidation.message,
    );
    setBuildingNameError(buildingNameValidationError);

    if (postcodeValidation.valid && !buildingNameValidationError) {
      const updatedData = {
        postcodeSearch: postcodeValidation.value,
        buildingNumber: buildingName.trim() || undefined,
      };
      console.log("[EnterDeliveryAddressPage] Saving to context:", updatedData);
      updateOrderAnswers(updatedData);

      // goToStep("select-delivery-address");
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
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">
        Enter your delivery address and we&apos;ll check if the kit&apos;s
        available
      </h1>

      {(postcodeError || buildingNameError) && (
        <ErrorSummary aria-labelledby="error-summary-title" role="alert">
          <ErrorSummary.Title id="error-summary-title">
            There is a problem
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
          label="Postcode"
          labelProps={{
            isPageHeading: false,
            size: "s",
          }}
          hint="For example, LS1 1AB"
          value={postcode}
          onChange={handlePostcodeChange}
          error={postcodeError || undefined}
        ></TextInput>

        <TextInput
          id="building-number-or-name"
          name="building-number-or-name"
          label="Building number or name (optional)"
          labelProps={{
            isPageHeading: false,
            size: "s",
          }}
          hint="For example, 15 or Prospect Cottage"
          value={buildingName}
          onChange={handleBuildingNameChange}
          error={buildingNameError || undefined}
        ></TextInput>

        <Button type="submit">Continue</Button>
      </form>

      <p className="nhsuk-body">
        <a onClick={() => goToStep(JourneyStepNames.EnterAddressManually)}>
          Enter address manually
        </a>
      </p>
    </PageLayout>
  );
}
