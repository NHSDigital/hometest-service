"use client";

import { Button, ErrorSummary, TextInput } from "nhsuk-react-components";
import { useAuth, useCreateOrderContext, useJourneyNavigationContext } from "@/state";
import FormPageLayout from "@/layouts/FormPageLayout";
import { JourneyStepNames } from "@/lib/models/route-paths";
import type { ValidationMessages } from "@/content/schema";
import laLookupService from "@/lib/services/la-lookup-service";
import { useContent } from "@/hooks";
import { useState } from "react";
import { isUnder18 } from "@/lib/utils/is-under-18";

const POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
const MAX_POSTCODE_LENGTH = 8;
const MAX_ADDRESS_LINE_LENGTH = 100;
const MAX_TOWN_LENGTH = 100;

const validateAddressLine1 = (
  value: string,
  validationMessages: ValidationMessages,
): string | null => {
  if (!value || value.trim() === "") {
    return validationMessages.addressLine1.required;
  }

  if (value.length > MAX_ADDRESS_LINE_LENGTH) {
    return validationMessages.addressLine1.maxLength;
  }

  const validCharactersRegex = /^[a-zA-Z0-9\s\-,./&#'"()]+$/;
  if (!validCharactersRegex.test(value)) {
    return validationMessages.addressLine1.invalid;
  }

  return null;
};

const validateAddressLine2 = (
  value: string,
  validationMessages: ValidationMessages,
): string | null => {
  if (!value || value.trim() === "") {
    return null;
  }

  if (value.length > MAX_ADDRESS_LINE_LENGTH) {
    return validationMessages.addressLine2.maxLength;
  }

  const validCharactersRegex = /^[a-zA-Z0-9\s\-,./&#'"()]+$/;
  if (!validCharactersRegex.test(value)) {
    return validationMessages.addressLine2.invalid;
  }

  return null;
};

const validateAddressLine3 = (
  value: string,
  validationMessages: ValidationMessages,
): string | null => {
  if (!value || value.trim() === "") {
    return null;
  }

  if (value.length > MAX_ADDRESS_LINE_LENGTH) {
    return validationMessages.addressLine3.maxLength;
  }

  const validCharactersRegex = /^[a-zA-Z0-9\s\-,./&#'"()]+$/;
  if (!validCharactersRegex.test(value)) {
    return validationMessages.addressLine3.invalid;
  }

  return null;
};

const validateTownOrCity = (
  value: string,
  validationMessages: ValidationMessages,
): string | null => {
  if (!value || value.trim() === "") {
    return validationMessages.townOrCity.required;
  }

  if (value.length > MAX_TOWN_LENGTH) {
    return validationMessages.townOrCity.maxLength;
  }

  const validCharactersRegex = /^[a-zA-Z\s\-'.]+$/;
  if (!validCharactersRegex.test(value)) {
    return validationMessages.townOrCity.invalid;
  }

  return null;
};

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

export default function EnterAddressManuallyPage() {
  const { orderAnswers, updateOrderAnswers } = useCreateOrderContext();
  const { goToStep, goBack, stepHistory, returnToStep, setReturnToStep } =
    useJourneyNavigationContext();
  const { commonContent, "enter-address-manually": content } = useContent();
  const { user } = useAuth();

  const [addressLine1, setAddressLine1] = useState(
    orderAnswers.addressEntryMethod === 'manual' ? (orderAnswers.deliveryAddress?.addressLine1 || "") : ""
  );
  const [addressLine2, setAddressLine2] = useState(
    orderAnswers.addressEntryMethod === 'manual' ? (orderAnswers.deliveryAddress?.addressLine2 || "") : ""
  );
  const [addressLine3, setAddressLine3] = useState(
    orderAnswers.addressEntryMethod === 'manual' ? (orderAnswers.deliveryAddress?.addressLine3 || "") : ""
  );
  const [townOrCity, setTownOrCity] = useState(
    orderAnswers.addressEntryMethod === 'manual' ? (orderAnswers.deliveryAddress?.postTown || "") : ""
  );
  const [postcode, setPostcode] = useState(
    orderAnswers.addressEntryMethod === 'manual' ? (orderAnswers.deliveryAddress?.postcode || "") : ""
  );

  const [addressLine1Error, setAddressLine1Error] = useState<string | null>(null);
  const [addressLine2Error, setAddressLine2Error] = useState<string | null>(null);
  const [addressLine3Error, setAddressLine3Error] = useState<string | null>(null);
  const [townOrCityError, setTownOrCityError] = useState<string | null>(null);
  const [postcodeError, setPostcodeError] = useState<string | null>(null);

  const isUnder18User = user ? isUnder18(user.birthdate) : false;

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

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    const addressLine1ValidationError = validateAddressLine1(
      addressLine1,
      commonContent.validation,
    );
    const addressLine2ValidationError = validateAddressLine2(
      addressLine2,
      commonContent.validation,
    );
    const addressLine3ValidationError = validateAddressLine3(
      addressLine3,
      commonContent.validation,
    );
    const townOrCityValidationError = validateTownOrCity(townOrCity, commonContent.validation);
    const postcodeValidation = validatePostcode(postcode, commonContent.validation);

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
      try {
        const postcode = postcodeValidation.value;
        const laResponse = await laLookupService.getByPostcode(postcode);
        if (!laResponse || !laResponse.suppliers || laResponse.suppliers.length === 0) {
          updateOrderAnswers({ postcodeSearch: postcode });
          goToStep(JourneyStepNames.KitNotAvailableInArea);
          return;
        }

        const updatedData = {
          deliveryAddress: {
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim() || undefined,
            addressLine3: addressLine3.trim() || undefined,
            postTown: townOrCity.trim(),
            postcode: postcode,
          },
          addressEntryMethod: "manual" as const,
          localAuthority: {
            code: laResponse.localAuthority.localAuthorityCode,
            region: laResponse.localAuthority.region,
          },
          supplier: laResponse.suppliers.map((supplier) => ({
            id: supplier.id,
            name: supplier.name,
            testCode: supplier.testCode,
          })),
        };

        updateOrderAnswers(updatedData);

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
      } catch (err) {
        // ALPHA: Remove the console log and use proper logging pattern
        console.error("Failed to lookup local authority:", err);
      }
    }
  };

  return (
    <FormPageLayout
      showBackButton
      onBackButtonClick={() => {
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep(JourneyStepNames.EnterDeliveryAddress);
        }
      }}
    >
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">{content.title}</h1>

      {(addressLine1Error ||
        addressLine2Error ||
        addressLine3Error ||
        townOrCityError ||
        postcodeError) && (
        <ErrorSummary aria-labelledby="error-summary-title" role="alert">
          <ErrorSummary.Title id="error-summary-title">
            {commonContent.errorSummary.title}
          </ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              {addressLine1Error && (
                <ErrorSummary.Item
                  href="#address-line-1"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("address-line-1")?.focus();
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
                    document.getElementById("address-line-2")?.focus();
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
                    document.getElementById("address-line-3")?.focus();
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
                    document.getElementById("address-town")?.focus();
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
                    document.getElementById("postcode")?.focus();
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
          label={content.form.addressLine1Label}
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
          label={content.form.addressLine2Label}
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
          label={content.form.addressLine3Label}
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
          label={content.form.townOrCityLabel}
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
          label={content.form.postcodeLabel}
          labelProps={{
            isPageHeading: false,
            size: "s",
          }}
          hint={content.form.postcodeHint}
          value={postcode}
          onChange={handlePostcodeChange}
          error={postcodeError || undefined}
          autoComplete="postal-code"
          inputMode="text"
          spellCheck={false}
        />

        <Button type="submit">{commonContent.navigation.continue}</Button>
      </form>
    </FormPageLayout>
  );
}
