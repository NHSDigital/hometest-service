"use client";

import { ActionLink, Button, Card, Details } from "nhsuk-react-components";
import { Link } from "react-router-dom";

import { LearnMoreAboutHivAndAidsLink } from "@/components/LearnMoreAboutHivAndAidsLink";
import { useContent } from "@/hooks";
import FormPageLayout from "@/layouts/FormPageLayout";
import { JourneyStepNames, RoutePath } from "@/lib/models/route-paths";
import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";

export default function GetSelfTestKitPage() {
  const { updateOrderAnswers } = useCreateOrderContext();
  const { goToStep } = useJourneyNavigationContext();
  const { commonContent, "get-self-test-kit-for-HIV": content } = useContent();

  return (
    <FormPageLayout>
      <h1>{content.title}</h1>

      <p>{content.ageRequirement}</p>
      <p>{content.availabilityNotice}</p>

      <Card cardType="urgent">
        <Card.Heading>{content.urgentCard.heading}</Card.Heading>
        <ul>
          <li>{content.urgentCard.exposureWarning}</li>
        </ul>

        <p>{content.urgentCard.clinicAdvice}</p>

        <ActionLink href={commonContent.links.sexualHealthClinic.href}>
          {commonContent.links.sexualHealthClinic.text}
        </ActionLink>

        <p>
          {content.urgentCard.aeAdvice}{" "}
          <a href={commonContent.links.nearestAE.href}>{commonContent.links.nearestAE.text}</a>.
        </p>
      </Card>

      <div className="nhsuk-inset-text">
        <p>{content.infoBox.text}</p>
      </div>

      <h2>{content.howItWorks.heading}</h2>
      <p>{content.howItWorks.deliveryInfo}</p>
      <p>
        <Link to="blood-sample-guide">{commonContent.links.bloodSampleGuide.text}</Link>
      </p>
      <p>{content.howItWorks.sampleInstructions}</p>

      <Details>
        <Details.Summary>{content.dataSharing.summary}</Details.Summary>
        <Details.Text>{content.dataSharing.details}</Details.Text>
      </Details>

      <Button
        onClick={() => {
          updateOrderAnswers({
            postcodeSearch: undefined,
            buildingNumber: undefined,
            deliveryAddress: undefined,
          });
          goToStep(JourneyStepNames.EnterDeliveryAddress);
        }}
      >
        {content.startButton}
      </Button>

      <h2>{content.aboutService.heading}</h2>
      <p>
        {content.aboutService.text}{" "}
        <Link to={RoutePath.HomeTestTermsOfUsePage}>{content.aboutService.termsLink}</Link> and{" "}
        <Link to={RoutePath.HomeTestPrivacyPolicyPage}>{content.aboutService.privacyLink}</Link>.
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
        </a>
        .
      </p>

      <LearnMoreAboutHivAndAidsLink />
    </FormPageLayout>
  );
}
