"use client";

import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Radios, Images, Button, ErrorSummary } from "nhsuk-react-components";
import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";
import { useContent } from "@/hooks";
import Link from "next/link";


export default function HowComfortablePrickingFingerPage() {
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();
  const { orderAnswers, updateOrderAnswers } = useCreateOrderContext();
  // const { "how-comfortable-pricking-finger": content } = useContent();

  const [selectedOption, setSelectedOption] = useState<string>("");
  const [optionError, setOptionError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOption || selectedOption.trim() === "") {
      setOptionError("Select yes if you're comfortable doing the test yourself");
      return;
    }

    setOptionError(null);

    updateOrderAnswers({
      comfortableDoingTest: selectedOption,
    });

    console.log("[HowComfortablePrickingFingerPage] comfortableDoingTest:", orderAnswers);

    if (selectedOption === "Yes") {
      // goToStep("mobile-phone");
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
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">This is what you'll need to do to give a blood sample</h1>
      <p></p>

      {optionError && (
        <ErrorSummary aria-labelledby="error-summary-title" role="alert">
          <ErrorSummary.Title id="error-summary-title">
            There is a problem
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
        src="/images/self-sample-step4.jpg"
        sizes="(max-width: 768px) 100vw, 66vw"
        srcSet="/images/self-sample-step4.png 600w, /images/self-sample-step4.png 1000w"
        alt="Person collecting blood sample by pricking finger, with blood droplet falling into collection tube."
      />

      <p className="nhsuk-body">
        To give a sample of blood, you'll need to:
      </p>

      <ul className="nhsuk-list nhsuk-list--bullet">
        <li>prick your finger</li>
        <li>fill a tube with blood</li>
      </ul>

      <p>
        <Link href="blood-sample-guide">Blood sample step-by-step guide</Link>
      </p>

      <form onSubmit={handleSubmit}>
        <Radios
          id="comfortable"
          name="comfortable"
          label="Are you comfortable doing the HIV self-test?"
          labelProps={{
            isPageHeading: false,
            size: "m",
          }}
          error={optionError || undefined}
          onChange={handleRadioChange}
        >
          <Radios.Radio value="Yes" hint="The test is supplied by [Supplier], a trusted partner of the NHS">
            Yes I'm comfortable, send me the kit
          </Radios.Radio>
          <Radios.Radio value="No" hint="They will take a blood sample for you">
            No, I'd rather go to a sexual health clinic instead
          </Radios.Radio>
        </Radios>

        <Button type="submit">Continue</Button>
      </form>
    </PageLayout>
  );
}
