"use client";

import { Button, Checkboxes, ErrorSummary, Fieldset, SummaryList } from "nhsuk-react-components";
import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";

import FormPageLayout from "@/layouts/FormPageLayout";
import { JourneyStepNames } from "@/lib/models/route-paths";
import { useContent } from "@/hooks";
import { useState } from "react";

function formatAddress(address: {
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  postTown?: string;
  postcode?: string;
}): string[] {
  return [
    address.addressLine1,
    address.addressLine2,
    address.addressLine3,
    address.postTown,
    address.postcode,
  ].filter((line): line is string => Boolean(line));
}

function formatUserName(user?: { givenName: string; familyName: string }): string {
  if (!user) return "";
  return `${user.givenName} ${user.familyName}`;
}

export default function CheckYourAnswersPage() {
  const { orderAnswers, updateOrderAnswers } = useCreateOrderContext();
  const { goToStep, goBack, stepHistory, setReturnToStep } = useJourneyNavigationContext();
  const { commonContent, "check-your-answers": content } = useContent();

  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  const supplierName = orderAnswers.supplier?.[0]?.name || "[Supplier]";

  const handleChangeClick = (field: "address" | "mobile" | "comfort") => {
    setReturnToStep(JourneyStepNames.CheckYourAnswers);

    if (field === "address") {
      // Route based on how address was entered
      if (orderAnswers.addressEntryMethod === "manual") {
        goToStep(JourneyStepNames.EnterAddressManually);
      } else {
        // Default to select address (postcode search flow)
        goToStep(JourneyStepNames.SelectDeliveryAddress);
      }
    } else if (field === "mobile") {
      // Route based on mobile number source
      if (orderAnswers.mobileNumberSource === "manual") {
        goToStep(JourneyStepNames.EnterMobileNumber);
      } else {
        // NHS Login flow
        goToStep(JourneyStepNames.ConfirmMobileNumber);
      }
    } else if (field === "comfort") {
      goToStep(JourneyStepNames.HowComfortablePrickingFinger);
    }
  };

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConsentChecked(e.target.checked);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!consentChecked) {
      setConsentError(commonContent.validation.consent.required);
      return;
    }

    setConsentError(null);

    const consentTimestamp = new Date().toISOString();
    updateOrderAnswers({
      consentGiven: true,
      consentTimestamp,
    });

    console.log("[CheckYourAnswersPage] Consent recorded at:", consentTimestamp);
    // TODO: Submit order via API
    console.log("[CheckYourAnswersPage] Submitting order:", orderAnswers);
  };

  const addressLines = orderAnswers.deliveryAddress
    ? formatAddress(orderAnswers.deliveryAddress)
    : [];

  return (
    <FormPageLayout
      showBackButton
      onBackButtonClick={() => {
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep(JourneyStepNames.EnterMobileNumber);
        }
      }}
    >
      <h1 className="nhsuk-heading-l">{content.title}</h1>

      {consentError && (
        <ErrorSummary aria-labelledby="error-summary-title" role="alert">
          <ErrorSummary.Title id="error-summary-title">
            {commonContent.errorSummary.title}
          </ErrorSummary.Title>
          <ErrorSummary.Body>
            <ErrorSummary.List>
              <ErrorSummary.Item
                href="#consent"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("consent-1")?.focus();
                }}
              >
                {consentError}
              </ErrorSummary.Item>
            </ErrorSummary.List>
          </ErrorSummary.Body>
        </ErrorSummary>
      )}

      <p className="nhsuk-body">{content.updateMessage}</p>
      <p className="nhsuk-body">{content.deliveryMessage}</p>

      <SummaryList>
        <SummaryList.Row>
          <SummaryList.Key>{content.summaryLabels.name}</SummaryList.Key>
          <SummaryList.Value>{formatUserName(orderAnswers.user)}</SummaryList.Value>
        </SummaryList.Row>

        <SummaryList.Row>
          <SummaryList.Key>{content.summaryLabels.deliveryAddress}</SummaryList.Key>
          <SummaryList.Value>
            {addressLines.map((line, index) => (
              <span key={index}>
                {line}
                {index < addressLines.length - 1 && <br />}
              </span>
            ))}
          </SummaryList.Value>
          <SummaryList.Actions>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleChangeClick("address");
              }}
            >
              {content.changeLink}
              <span className="nhsuk-u-visually-hidden">
                {" "}
                {content.summaryLabels.deliveryAddress}
              </span>
            </a>
          </SummaryList.Actions>
        </SummaryList.Row>

        <SummaryList.Row>
          <SummaryList.Key>{content.summaryLabels.comfortableDoingTest}</SummaryList.Key>
          <SummaryList.Value>
            {orderAnswers.comfortableDoingTest === "Yes"
              ? "Yes I'm comfortable, send me the kit"
              : orderAnswers.comfortableDoingTest}
          </SummaryList.Value>
          <SummaryList.Actions>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleChangeClick("comfort");
              }}
            >
              {content.changeLink}
              <span className="nhsuk-u-visually-hidden">
                {" "}
                {content.summaryLabels.comfortableDoingTest}
              </span>
            </a>
          </SummaryList.Actions>
        </SummaryList.Row>

        <SummaryList.Row>
          <SummaryList.Key>{content.summaryLabels.mobileNumber}</SummaryList.Key>
          <SummaryList.Value>{orderAnswers.mobileNumber}</SummaryList.Value>
          <SummaryList.Actions>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleChangeClick("mobile");
              }}
            >
              {content.changeLink}
              <span className="nhsuk-u-visually-hidden"> {content.summaryLabels.mobileNumber}</span>
            </a>
          </SummaryList.Actions>
        </SummaryList.Row>
      </SummaryList>

      <form onSubmit={handleSubmit}>
        <Fieldset>
          <Fieldset.Legend size="m">{content.consent.legend}</Fieldset.Legend>
          <Checkboxes id="consent" name="consent" error={consentError || undefined}>
            <Checkboxes.Box value="consent" checked={consentChecked} onChange={handleConsentChange}>
              {content.consent.label.replace("{supplier}", supplierName)}{" "}
              <a href={content.consent.termsOfUseHref}>{content.consent.termsOfUseText}</a>{" "}
              {content.consent.labelAnd}{" "}
              <a href={content.consent.privacyPolicyHref}>{content.consent.privacyPolicyText}</a>.
            </Checkboxes.Box>
          </Checkboxes>
        </Fieldset>

        <Button type="submit">{content.submitButton}</Button>
      </form>
    </FormPageLayout>
  );
}
