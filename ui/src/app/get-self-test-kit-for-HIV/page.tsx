"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, ActionLink, Button, Details } from "nhsuk-react-components";
import { PageLayout } from "@/components/PageLayout";
import { useOrderContext, useNavigationContext } from "@/state";
import { useContent } from "@/hooks";

export default function GetSelfTestKitPage() {
  const { updateOrderAnswers } = useOrderContext();
  const { goToStep } = useNavigationContext();
  const { commonContent, "get-self-test-kit-for-HIV": content } = useContent();

  useEffect(() => {
    // TODO: Replace with actual auth data from NHS Login redirect
    // This mock data simulates what will come from the auth response
    const authData = {
      sub: "49f470a1-cc52-49b7-beba-0f9cec937c46",
      nhsNumber: "9686368973",
      birthdate: "1968-02-12",
      identityProofingLevel: "P9",
      phoneNumber: "+447887510886",
    };

    updateOrderAnswers({ user: authData });
    console.log("[GetSelfTestKitPage] Auth data set:", authData);
  }, [updateOrderAnswers]);

  return (
    <PageLayout>
      <h1>{content.title}</h1>

      <p>{content.ageRequirement}</p>
      <p>{content.availabilityNotice}</p>

      <Card cardType="urgent">
        <Card.Heading>{content.urgentCard.heading}</Card.Heading>
        <Card.Content>
          <p style={{ listStyle: 'disc', marginLeft: '1.2em', display: 'list-item' }}>
            {content.urgentCard.exposureWarning}
          </p>

          <p>{content.urgentCard.clinicAdvice}</p>

          <ActionLink href={commonContent.links.sexualHealthClinic.href}>
            {commonContent.links.sexualHealthClinic.text}
          </ActionLink>

          <p>
            {content.urgentCard.aeAdvice}{" "}
            <a href={commonContent.links.nearestAE.href}>
              {commonContent.links.nearestAE.text}
            </a>
            .
          </p>
        </Card.Content>
      </Card>

      <div className="nhsuk-inset-text">
        <span className="nhsuk-u-visually-hidden">{content.infoBox.hiddenText}</span>
        <p>{content.infoBox.antibodyInfo}</p>
      </div>

      <h2>{content.howItWorks.heading}</h2>
      <p>{content.howItWorks.deliveryInfo}</p>
      <p>
        <Link href="step-by-step-guide">{content.howItWorks.stepByStepLink}</Link>
      </p>
      <p>{content.howItWorks.sampleInstructions}</p>

      <Details>
        <Details.Summary>{content.dataSharing.summary}</Details.Summary>
        <Details.Text>{content.dataSharing.details}</Details.Text>
      </Details>

      <Button onClick={() => goToStep("enter-delivery-address")}>
        {content.startButton}
      </Button>

      <h2>{content.aboutService.heading}</h2>
      <p>
        {content.aboutService.text}{" "}
        <Link href="terms-and-conditions">{content.aboutService.termsLink}</Link> and{" "}
        <Link href="privacy-policy">{content.aboutService.privacyLink}</Link>.
      </p>

      <h2>{content.otherOptions.heading}</h2>
      <p>
        {content.otherOptions.clinicText}{" "}
        <a href={commonContent.links.sexualHealthClinic.href}>
          {content.otherOptions.clinicLinkText}
        </a>{" "}
        {content.otherOptions.clinicTextEnd}
      </p>
      <p>
        {content.otherOptions.sexualHealthText}{" "}
        <a href={content.otherOptions.sexualHealthLink.href}>
          {content.otherOptions.sexualHealthLink.text}
        </a>.
      </p>
      <p>
        <a href={content.otherOptions.learnMoreLink.href}>
          {content.otherOptions.learnMoreLink.text}
        </a>
      </p>
    </PageLayout>
  );
}
