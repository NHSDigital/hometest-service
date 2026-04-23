"use client";

import { Button, ErrorSummary, Images, Radios } from "nhsuk-react-components";
import { useState } from "react";

import { useContent } from "@/hooks";
import FormPageLayout from "@/layouts/FormPageLayout";
import { JourneyStepNames } from "@/lib/models/route-paths";
import { useAuth, useCreateOrderContext, useJourneyNavigationContext } from "@/state";

export default function HowComfortablePrickingFingerPage() {
  const { goToStep, goBack, stepHistory, returnToStep, setReturnToStep } =
    useJourneyNavigationContext();
  const { orderAnswers, updateOrderAnswers } = useCreateOrderContext();
  const { user } = useAuth();
  const { commonContent, "how-comfortable-pricking-finger": content } = useContent();

  const [selectedOption, setSelectedOption] = useState<string>(
    orderAnswers.comfortableDoingTest || "",
  );
  const [optionError, setOptionError] = useState<string | null>(null);

  const supplierName = orderAnswers.supplier?.[0]?.name || "The supplier";

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!selectedOption || selectedOption.trim() === "") {
      setOptionError(commonContent.validation.comfortableDoingTest.required);
      return;
    }

    setOptionError(null);

    updateOrderAnswers({
      comfortableDoingTest: selectedOption,
    });

    if (selectedOption === "Yes") {
      if (returnToStep) {
        const step = returnToStep;
        setReturnToStep(null);
        goToStep(step);
      } else if (user?.phoneNumber) {
        goToStep(JourneyStepNames.ConfirmMobileNumber);
      } else {
        goToStep(JourneyStepNames.EnterMobileNumber);
      }
    } else {
      goToStep(JourneyStepNames.GoToClinic);
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(e.target.value);
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

      {optionError && (
        <ErrorSummary aria-labelledby="error-summary-title" role="alert">
          <ErrorSummary.Title id="error-summary-title">
            {commonContent.errorSummary.title}
          </ErrorSummary.Title>
          <ErrorSummary.List>
            <ErrorSummary.ListItem
              href="#comfortable"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("comfortable-1")?.focus();
              }}
            >
              {optionError}
            </ErrorSummary.ListItem>
          </ErrorSummary.List>
        </ErrorSummary>
      )}

      <Images
        src="/images/self-sample-steps/self-sample-step4.svg"
        sizes="(max-width: 768px) 100vw, 66vw"
        srcSet="/images/self-sample-steps/self-sample-step4.svg 600w, /images/self-sample-steps/self-sample-step4.svg 1000w"
        alt={content.image.alt}
      />

      <p className="nhsuk-body">{content.instructions}</p>

      <ul className="nhsuk-list nhsuk-list--bullet">
        <li>{content.steps.prickFinger}</li>
        <li>{content.steps.fillTube}</li>
      </ul>

      <p>
        <a
          href="blood-sample-guide"
          onClick={(e) => {
            e.preventDefault();
            goToStep(JourneyStepNames.BloodSampleGuide);
          }}
        >
          {commonContent.links.bloodSampleGuide.text}
        </a>
      </p>

      <form onSubmit={handleSubmit}>
        <Radios
          id="comfortable"
          name="comfortable"
          legend={content.formLabel}
          legendProps={{
            isPageHeading: false,
            size: "m",
          }}
          error={optionError || undefined}
          onChange={handleRadioChange}
        >
          <Radios.Item
            value="Yes"
            hint={content.options.yes.hint.replace("{supplier}", supplierName)}
            checked={selectedOption === "Yes"}
          >
            {content.options.yes.text}
          </Radios.Item>
          <Radios.Item value="No" hint={content.options.no.hint} checked={selectedOption === "No"}>
            {content.options.no.text}
          </Radios.Item>
        </Radios>

        <Button type="submit">{commonContent.navigation.continue}</Button>
      </form>
    </FormPageLayout>
  );
}
