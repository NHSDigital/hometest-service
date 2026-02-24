"use client";

import { useState } from "react";
import { Button, ErrorSummary, TextInput } from "nhsuk-react-components";
import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";
import { useContent } from "@/hooks";
import { JourneyStepNames } from "@/lib/models/route-paths";
import { createMobileNumberSchema } from "@/lib/validation/mobile-number-schema";
import PageLayout from "@/layouts/PageLayout";

export default function EnterMobileNumberPage() {
  const { orderAnswers, updateOrderAnswers } = useCreateOrderContext();
  const { goToStep, goBack, stepHistory, returnToStep, setReturnToStep } = useJourneyNavigationContext();
  const { commonContent, "enter-mobile-phone-number": content } = useContent();

  const [mobileNumber, setMobileNumber] = useState(orderAnswers.mobileNumber || "");
  const [mobileNumberError, setMobileNumberError] = useState<string | null>(null);

  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMobileNumber(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const mobileNumberSchema = createMobileNumberSchema(commonContent.validation);
    const result = mobileNumberSchema.safeParse(mobileNumber);

    if (!result.success) {
      setMobileNumberError(result.error.issues[0].message);
    } else {
      setMobileNumberError(null);
      const updatedData = {
        mobileNumber: result.data,
        mobileNumberSource: 'manual' as const,
      };
      console.log("[EnterMobileNumberPage] Saving to context:", updatedData);
      updateOrderAnswers(updatedData);

      if (returnToStep) {
        const step = returnToStep;
        setReturnToStep(null);
        goToStep(step);
      } else {
        goToStep("check-your-answers");
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
          goToStep(JourneyStepNames.HowComfortablePrickingFinger);
        }
      }}
    >
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">
        {content.title}
      </h1>

      <p className="nhsuk-body">{content.description}</p>

      {mobileNumberError && (
        <ErrorSummary aria-labelledby="error-summary-title" role="alert">
          <ErrorSummary.Title id="error-summary-title">
            {commonContent.errorSummary.title}
          </ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item
                href="#mobile-number"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("mobile-number")?.focus();
                }}
              >
                {mobileNumberError}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}

      <form onSubmit={handleSubmit}>
        <TextInput
          id="mobile-number"
          name="mobile-number"
          label={content.form.label}
          labelProps={{
            isPageHeading: false,
            size: "s",
          }}
          hint={content.form.hint}
          value={mobileNumber}
          onChange={handleMobileNumberChange}
          error={mobileNumberError || undefined}
          className="nhsuk-input--width-10"
        />

        <Button type="submit">{commonContent.navigation.continue}</Button>
      </form>
    </PageLayout>
  );
}
