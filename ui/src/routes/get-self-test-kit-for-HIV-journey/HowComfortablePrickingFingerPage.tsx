"use client";

import { useState } from "react";
import { Radios, Images, Button, ErrorSummary } from "nhsuk-react-components";
import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";
import { useContent } from "@/hooks";
import { JourneyStepNames } from "@/lib/models/route-paths";
import PageLayout from "@/layouts/PageLayout";

// TODO: update to dynamically render supplier based on API (probably stored in state)

export default function HowComfortablePrickingFingerPage() {
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();
  const { orderAnswers, updateOrderAnswers } = useCreateOrderContext();
  const { commonContent, "how-comfortable-pricking-finger": content } = useContent();

  const [selectedOption, setSelectedOption] = useState<string>("");
  const [optionError, setOptionError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOption || selectedOption.trim() === "") {
      setOptionError(commonContent.validation.comfortableDoingTest.required);
      return;
    }

    setOptionError(null);

    updateOrderAnswers({
      comfortableDoingTest: selectedOption,
    });

    console.log("[HowComfortablePrickingFingerPage] comfortableDoingTest:", orderAnswers);

    if (selectedOption === "Yes") {
      if (orderAnswers.user?.phoneNumber) {
        goToStep(JourneyStepNames.ConfirmMobileNumber);
      } else {
        goToStep(JourneyStepNames.EnterMobileNumber);
      }
    } else {
      // goToStep("visit-nearest-clinic");
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(e.target.value);
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
      }}>
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">{content.title}</h1>

      {optionError && (
        <ErrorSummary aria-labelledby="error-summary-title" role="alert">
          <ErrorSummary.Title id="error-summary-title">
            {commonContent.errorSummary.title}
          </ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item
                href="#comfortable"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('comfortable-1')?.focus();
                }}
              >
                {optionError}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}

      <Images
        src="/images/self-sample-steps/self-sample-step4.jpg"
        sizes="(max-width: 768px) 100vw, 66vw"
        srcSet="/images/self-sample-steps/self-sample-step4.png 600w, /images/self-sample-steps/self-sample-step4.png 1000w"
        alt={content.image.alt}
      />

      <p className="nhsuk-body">
        {content.instructions}
      </p>

      <ul className="nhsuk-list nhsuk-list--bullet">
        <li>{content.steps.prickFinger}</li>
        <li>{content.steps.fillTube}</li>
      </ul>

      <p>
        <a
            href="blood-sample-guide"
            onClick={(e) => {
              e.preventDefault();
              goToStep("blood-sample-guide");
            }}
          >
            {commonContent.links.bloodSampleGuide.text}
          </a>
      </p>

      <form onSubmit={handleSubmit}>
        <Radios
          id="comfortable"
          name="comfortable"
          label={content.formLabel}
          labelProps={{
            isPageHeading: false,
            size: "m",
          }}
          error={optionError || undefined}
          onChange={handleRadioChange}
        >
          <Radios.Radio value="Yes" hint={content.options.yes.hint}>
            {content.options.yes.text}
          </Radios.Radio>
          <Radios.Radio value="No" hint={content.options.no.hint}>
            {content.options.no.text}
          </Radios.Radio>
        </Radios>

        <Button type="submit">{commonContent.navigation.continue}</Button>
      </form>
    </PageLayout>
  );
}
