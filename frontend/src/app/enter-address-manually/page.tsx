"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/PageLayout";
import { Fieldset, TextInput, Button } from "nhsuk-react-components";
import { useOrderContext } from "../OrderContext";

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

const validatePostcode = (postcode: string): string | null => {
  if (!postcode || postcode.trim() === "") {
    return "Enter a full UK postcode";
  }

  if (postcode.length > MAX_POSTCODE_LENGTH) {
    return "Postcode must be 8 characters or less";
  }

  if (!POSTCODE_REGEX.test(postcode)) {
    return "Enter a full UK postcode";
  }

  return null;
};

export default function EnterAddressManuallyPage() {
  const router = useRouter();
  const { orderAnswers, updateOrderAnswers } = useOrderContext();

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
    const postcodeValidationError = validatePostcode(postcode);

    setAddressLine1Error(addressLine1ValidationError);
    setAddressLine2Error(addressLine2ValidationError);
    setAddressLine3Error(addressLine3ValidationError);
    setTownOrCityError(townOrCityValidationError);
    setPostcodeError(postcodeValidationError);

    if (
      !addressLine1ValidationError &&
      !addressLine2ValidationError &&
      !addressLine3ValidationError &&
      !townOrCityValidationError &&
      !postcodeValidationError
    ) {
      const updatedData = {
        deliveryAddress: {
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          addressLine3: addressLine3.trim() || undefined,
          postTown: townOrCity.trim(),
          postcode: postcode.trim().toUpperCase(),
        },
      };
      console.log("[EnterAddressManuallyPage] Saving to context:", updatedData);
      updateOrderAnswers(updatedData);
      // router.push("/how-comfortable");
    }
  };

  return (
    <PageLayout>
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">
        Enter your delivery address manually and we&apos;ll check if the
        kit&apos;s available
      </h1>

      <form onSubmit={handleSubmit}>
        <Fieldset>
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
        </Fieldset>

        <Button type="submit">Continue</Button>
      </form>
    </PageLayout>
  );
}