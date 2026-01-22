"use client";

import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Fieldset, TextInput, Button } from "nhsuk-react-components";
import Link from "next/link";

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

  const validCharactersRegex = /^[a-zA-Z0-9\s\-,./&#'"()]+$/;
  if (!validCharactersRegex.test(buildingName)) {
    return "Enter the building number or name";
  }

  return null;
};

export default function EnterDeliveryAddressPage() {
  const [postcode, setPostcode] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const [buildingNameError, setBuildingNameError] = useState<string | null>(null);

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
      // TODO: Submit form data to state and navigate to the next page
      console.log("Form submitted:", { postcode, buildingName });
    }
  };

  return (
    <PageLayout>
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
        <Link href="enter-address-manually">Enter address manually</Link>
      </p>
    </PageLayout>
  );
}
