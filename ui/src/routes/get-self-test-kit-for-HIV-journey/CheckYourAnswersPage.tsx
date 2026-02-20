"use client";

import { Button, SummaryList } from "nhsuk-react-components";
import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";
import { useContent } from "@/hooks";
import { JourneyStepNames } from "@/lib/models/route-paths";
import PageLayout from "@/layouts/PageLayout";

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
  const { orderAnswers } = useCreateOrderContext();
  const { goToStep, goBack, setReturnToStep } = useJourneyNavigationContext();
  const { "check-your-answers": content } = useContent();

  const handleChangeClick = (targetStep: string) => {
    setReturnToStep(JourneyStepNames.CheckYourAnswers);
    goToStep(targetStep);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit order via API
    console.log("[CheckYourAnswersPage] Submitting order:", orderAnswers);
  };

  const addressLines = orderAnswers.deliveryAddress
    ? formatAddress(orderAnswers.deliveryAddress)
    : [];

  return (
    <PageLayout
      showBackButton
      onBackButtonClick={() => goBack()}
    >
      <h1 className="nhsuk-heading-l">{content.title}</h1>

      <p className="nhsuk-body">{content.updateMessage}</p>
      <p className="nhsuk-body">{content.deliveryMessage}</p>

      <SummaryList>
        <SummaryList.Row>
          <SummaryList.Key>{content.summaryLabels.name}</SummaryList.Key>
          <SummaryList.Value>
            {formatUserName(orderAnswers.user)}
          </SummaryList.Value>
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
                handleChangeClick(JourneyStepNames.EnterDeliveryAddress);
              }}
            >
              {content.changeLink}
              <span className="nhsuk-u-visually-hidden">
                {" "}{content.summaryLabels.deliveryAddress}
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
                handleChangeClick(JourneyStepNames.HowComfortablePrickingFinger);
              }}
            >
              {content.changeLink}
              <span className="nhsuk-u-visually-hidden">
                {" "}{content.summaryLabels.comfortableDoingTest}
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
                handleChangeClick(JourneyStepNames.EnterMobileNumber);
              }}
            >
              {content.changeLink}
              <span className="nhsuk-u-visually-hidden">
                {" "}{content.summaryLabels.mobileNumber}
              </span>
            </a>
          </SummaryList.Actions>
        </SummaryList.Row>
      </SummaryList>

      <form onSubmit={handleSubmit}>
        <Button type="submit">{content.submitButton}</Button>
      </form>
    </PageLayout>
  );
}
