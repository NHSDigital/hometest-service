"use client";

import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Fieldset, TextInput, Button } from "nhsuk-react-components";
import { useOrderContext, useNavigationContext } from "@/state";
import Link from "next/link";

// TODO: update redirect logic if user has selected manual address entry (use goToStep)
// TODO: add postcode lookup integration

const POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
const MAX_POSTCODE_LENGTH = 8;
const MAX_BUILDING_NAME_LENGTH = 100;

// Validation functions
const validatePostcode = (postcode: string): string | null => {
  if (!postcode || postcode.trim() === "") {
    return "Enter a full UK postcode";
  }

  if (postcode.length > MAX_POSTCODE_LENGTH) {
    return "Postcode must be 8 characters or less";
  }

  if (!POSTCODE_REGEX.test(postcode)) {
    return "Enter a postcode using letters and numbers";
  }

  return null;
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
  const { orderAnswers, updateOrderAnswers } = useOrderContext();
  const { goToStep, goBack, stepHistory } = useNavigationContext();

  const [postcode, setPostcode] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const [buildingNameError, setBuildingNameError] = useState<string | null>(null);

  console.log("[EnterDeliveryAddressPage] Current order state:", orderAnswers);

  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostcode(e.target.value);
  };

  const handleBuildingNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuildingName(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const postcodeValidationError = validatePostcode(postcode);
    const buildingNameValidationError = validateBuildingName(buildingName);

    setPostcodeError(postcodeValidationError);
    setBuildingNameError(buildingNameValidationError);

    // Only proceed if no validation errors
    if (!postcodeValidationError && !buildingNameValidationError) {
      const updatedData = {
        postcodeSearch: postcode.trim(),
        buildingNumber: buildingName.trim() || undefined,
      };
      console.log("[EnterDeliveryAddressPage] Saving to context:", updatedData);
      updateOrderAnswers(updatedData);

      // Navigate to next step using NavigationContext
      // for now use hard coded value to simulate no address found
      if (updatedData.postcodeSearch == "BT655EU") {
        goToStep("no-address-found");
      } else { 
        goToStep("select-delivery-address"); 
      }
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

      <form onSubmit={handleSubmit}>
        <Fieldset>
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
        </Fieldset>

        <Button type="submit">Continue</Button>
      </form>

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
