"use client";

import { Button, ErrorSummary, Radios, TextInput } from "nhsuk-react-components";
import { useState } from "react";

import { useContent } from "@/hooks";
import FormPageLayout from "@/layouts/FormPageLayout";
import { JourneyStepNames } from "@/lib/models/route-paths";
import { createMobileNumberSchema } from "@/lib/validation/mobile-number-schema";
import { useAuth, useCreateOrderContext, useJourneyNavigationContext } from "@/state";

export default function ConfirmMobileNumberPage() {
  const { orderAnswers, updateOrderAnswers } = useCreateOrderContext();
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();
  const { user } = useAuth();
  const { commonContent, "confirm-mobile-phone-number": content } = useContent();

  const nhsPhone = user?.phoneNumber;
  const supplierName = orderAnswers.supplier?.[0]?.name || "[Supplier]";

  // Pre-populate based on existing data
  const getInitialSelection = (): "nhs-mobile-number" | "other" | null => {
    if (!orderAnswers.mobileNumber) return null;
    if (orderAnswers.mobileNumberSource === "nhs-login") return "nhs-mobile-number";
    if (orderAnswers.mobileNumberSource === "manual") return "other";
    return null;
  };

  const [selectedOption, setSelectedOption] = useState<"nhs-mobile-number" | "other" | null>(
    getInitialSelection(),
  );
  const [alternativeNumber, setAlternativeNumber] = useState(
    orderAnswers.mobileNumberSource === "manual" ? orderAnswers.mobileNumber || "" : "",
  );
  const [error, setError] = useState<string | null>(null);

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(e.target.value as "nhs-mobile-number" | "other");
    setError(null);
  };

  const handleAlternativeNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAlternativeNumber(e.target.value);
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!selectedOption) {
      setError("Select your mobile phone number or use another mobile phone number");
      return;
    }

    if (selectedOption === "nhs-mobile-number") {
      updateOrderAnswers({
        mobileNumber: nhsPhone,
        mobileNumberSource: "nhs-login",
      });

      goToStep(JourneyStepNames.CheckYourAnswers);
    } else {
      const mobileNumberSchema = createMobileNumberSchema(commonContent.validation);
      const result = mobileNumberSchema.safeParse(alternativeNumber);

      if (result.success) {
        setError(null);
        updateOrderAnswers({
          mobileNumber: result.data,
          mobileNumberSource: "manual",
        });

        goToStep(JourneyStepNames.CheckYourAnswers);
      } else {
        setError(result.error.issues[0].message);
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
          goToStep(JourneyStepNames.HowComfortablePrickingFinger);
        }
      }}
    >
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">{content.title}</h1>

      {error && (
        <ErrorSummary aria-labelledby="error-summary-title" role="alert">
          <ErrorSummary.Title id="error-summary-title">
            {commonContent.errorSummary.title}
          </ErrorSummary.Title>
          <ErrorSummary.List>
            <ErrorSummary.ListItem
              href="#phone-confirmation"
              onClick={(e) => {
                e.preventDefault();
                if (selectedOption === "other") {
                  document.getElementById("alternative-mobile-number")?.focus();
                } else {
                  document.getElementById("phone-confirmation-1")?.focus();
                }
              }}
            >
              {error}
            </ErrorSummary.ListItem>
          </ErrorSummary.List>
        </ErrorSummary>
      )}

      <form onSubmit={handleSubmit}>
        <Radios
          name="phone-confirmation"
          id="phone-confirmation"
          error={error || undefined}
          hint={content.hint.replace("{supplier}", supplierName)}
          legend={content.radioLegend}
          legendProps={{ className: "nhsuk-u-visually-hidden" }}
        >
          <Radios.Item
            id="phone-confirmation-1"
            value="nhs-mobile-number"
            checked={selectedOption === "nhs-mobile-number"}
            onChange={handleRadioChange}
          >
            {nhsPhone}
          </Radios.Item>

          <Radios.Item
            id="phone-confirmation-2"
            value="other"
            checked={selectedOption === "other"}
            onChange={handleRadioChange}
            conditional={
              selectedOption === "other" ? (
                <TextInput
                  id="alternative-mobile-number"
                  name="alternative-mobile-number"
                  label={content.form.alternativeInputLabel}
                  labelProps={{
                    isPageHeading: false,
                    size: "s",
                  }}
                  hint={content.form.alternativeInputHint}
                  value={alternativeNumber}
                  onChange={handleAlternativeNumberChange}
                  className="nhsuk-input--width-10"
                  autoComplete="tel"
                />
              ) : undefined
            }
          >
            {content.form.alternativeLabel}
          </Radios.Item>
        </Radios>

        <Button type="submit">{commonContent.navigation.continue}</Button>
      </form>
    </FormPageLayout>
  );
}
