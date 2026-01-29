"use client";

import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { TextInput, Button, ErrorSummary } from "nhsuk-react-components";
import { useOrderContext, useNavigationContext } from "@/state";

const POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
const MAX_POSTCODE_LENGTH = 8;
const MAX_ADDRESS_LINE_LENGTH = 100;
const MAX_TOWN_LENGTH = 100;

const validateAddressLine1 = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "Enter address line 1, typically the building and street";
  }

  if (value.length > MAX_ADDRESS_LINE_LENGTH) {
    return "Address line 1 must be 100 characters or less";
  }

  const validCharactersRegex = /^[a-zA-Z0-9\s\-,./&#'"()]+$/;
  if (!validCharactersRegex.test(value)) {
    return "Enter address line 1, typically the building and street";
  }

  return null;
};

const validateAddressLine2 = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return null;
  }

  if (value.length > MAX_ADDRESS_LINE_LENGTH) {
    return "Address line 2 must be 100 characters or less";
  }

  const validCharactersRegex = /^[a-zA-Z0-9\s\-,./&#'"()]+$/;
  if (!validCharactersRegex.test(value)) {
    return "Enter address line 2, typically the building and street";
  }

  return null;
};

const validateAddressLine3 = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return null;
  }

  if (value.length > MAX_ADDRESS_LINE_LENGTH) {
    return "Address line 3 must be 100 characters or less";
  }

  const validCharactersRegex = /^[a-zA-Z0-9\s\-,./&#'"()]+$/;
  if (!validCharactersRegex.test(value)) {
    return "Enter address line 3, typically the building and street";
  }

  return null;
};

const validateTownOrCity = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return "Enter a city or town";
  }

  if (value.length > MAX_TOWN_LENGTH) {
    return "City or town must be 100 characters or less";
  }

  const validCharactersRegex = /^[a-zA-Z\s\-'.]+$/;
  if (!validCharactersRegex.test(value)) {
    return "Enter a city or town";
  }

  return null;
};

const validatePostcode = (postcode: string): { valid: true; value: string } | { valid: false; message: string } => {
  if (!postcode || postcode.trim() === "") {
    return { valid: false, message: "Enter a full UK postcode" };
  }

  if (postcode.length > MAX_POSTCODE_LENGTH) {
    return { valid: false, message: "Postcode must be 8 characters or less" };
  }

  const normalizedPostcode = postcode.trim().toUpperCase();

  if (!POSTCODE_REGEX.test(normalizedPostcode)) {
    return { valid: false, message: "Enter a postcode using letters and numbers" };
  }

  return { valid: true, value: normalizedPostcode };
};

export default function EnterAddressManuallyPage() {
  const { orderAnswers, updateOrderAnswers } = useOrderContext();
  const { goToStep, goBack, stepHistory } = useNavigationContext();

  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressLine3, setAddressLine3] = useState("");
  const [townOrCity, setTownOrCity] = useState("");
  const [postcode, setPostcode] = useState("");

  const [addressLine1Error, setAddressLine1Error] = useState<string | null>(null);
  const [addressLine2Error, setAddressLine2Error] = useState<string | null>(null);
  const [addressLine3Error, setAddressLine3Error] = useState<string | null>(null);
  const [townOrCityError, setTownOrCityError] = useState<string | null>(null);
  const [postcodeError, setPostcodeError] = useState<string | null>(null);

  console.log("[EnterAddressManuallyPage] Current order state:", orderAnswers);

  const handleAddressLine1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressLine1(e.target.value);
  };

  const handleAddressLine2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressLine2(e.target.value);
  };

  const handleAddressLine3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressLine3(e.target.value);
  };

  const handleTownOrCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTownOrCity(e.target.value);
  };

  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostcode(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const addressLine1ValidationError = validateAddressLine1(addressLine1);
    const addressLine2ValidationError = validateAddressLine2(addressLine2);
    const addressLine3ValidationError = validateAddressLine3(addressLine3);
    const townOrCityValidationError = validateTownOrCity(townOrCity);
    const postcodeValidation = validatePostcode(postcode);

    setAddressLine1Error(addressLine1ValidationError);
    setAddressLine2Error(addressLine2ValidationError);
    setAddressLine3Error(addressLine3ValidationError);
    setTownOrCityError(townOrCityValidationError);
    setPostcodeError(postcodeValidation.valid ? null : postcodeValidation.message);

    if (
      !addressLine1ValidationError &&
      !addressLine2ValidationError &&
      !addressLine3ValidationError &&
      !townOrCityValidationError &&
      postcodeValidation.valid
    ) {
      const updatedData = {
        deliveryAddress: {
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          addressLine3: addressLine3.trim() || undefined,
          postTown: townOrCity.trim(),
          postcode: postcodeValidation.value,
        },
      };
      console.log("[EnterAddressManuallyPage] Saving to context:", updatedData);
      updateOrderAnswers(updatedData);

      // Navigate to next step using NavigationContext
      // goToStep("how-comfortable");
    }
  };

  return (
    <PageLayout
      showBackButton
      onBackButtonClick={() => {
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep("enter-delivery-address");
        }
      }}
    >
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">
        Enter your delivery address manually and we&apos;ll check if the
        kit&apos;s available
      </h1>

      {(addressLine1Error || addressLine2Error || addressLine3Error || townOrCityError || postcodeError) && (
        <ErrorSummary aria-labelledby="error-summary-title" role="alert">
          <ErrorSummary.Title id="error-summary-title">
            There is a problem
          </ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {addressLine1Error && (
                <ErrorSummary.Item
                  href="#address-line-1"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('address-line-1')?.focus();
                  }}
                >
                  {addressLine1Error}
                </ErrorSummary.Item>
              )}
              {addressLine2Error && (
                <ErrorSummary.Item
                  href="#address-line-2"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('address-line-2')?.focus();
                  }}
                >
                  {addressLine2Error}
                </ErrorSummary.Item>
              )}
              {addressLine3Error && (
                <ErrorSummary.Item
                  href="#address-line-3"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('address-line-3')?.focus();
                  }}
                >
                  {addressLine3Error}
                </ErrorSummary.Item>
              )}
              {townOrCityError && (
                <ErrorSummary.Item
                  href="#address-town"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('address-town')?.focus();
                  }}
                >
                  {townOrCityError}
                </ErrorSummary.Item>
              )}
              {postcodeError && (
                <ErrorSummary.Item
                  href="#postcode"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('postcode')?.focus();
                  }}
                >
                  {postcodeError}
                </ErrorSummary.Item>
              )}
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}

      <form onSubmit={handleSubmit}>
        <TextInput
          id="address-line-1"
            name="address-line-1"
            label="Address line 1"
            labelProps={{
              isPageHeading: false,
              size: "s",
            }}
            value={addressLine1}
            onChange={handleAddressLine1Change}
            error={addressLine1Error || undefined}
            autoComplete="address-line1"
          />

          <TextInput
            id="address-line-2"
            name="address-line-2"
            label="Address line 2 (optional)"
            labelProps={{
              isPageHeading: false,
              size: "s",
            }}
            value={addressLine2}
            onChange={handleAddressLine2Change}
            error={addressLine2Error || undefined}
            autoComplete="address-line2"
          />

          <TextInput
            id="address-line-3"
            name="address-line-3"
            label="Address line 3 (optional)"
            labelProps={{
              isPageHeading: false,
              size: "s",
            }}
            value={addressLine3}
            onChange={handleAddressLine3Change}
            error={addressLine3Error || undefined}
            autoComplete="address-line3"
          />

          <TextInput
            id="address-town"
            name="address-town"
            label="Town or city"
            labelProps={{
              isPageHeading: false,
              size: "s",
            }}
            value={townOrCity}
            onChange={handleTownOrCityChange}
            error={townOrCityError || undefined}
            autoComplete="address-level2"
          />

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
            autoComplete="postal-code"
            inputMode="text"
            spellCheck={false}
          />

        <Button type="submit">Continue</Button>
      </form>
    </PageLayout>
  );
}
