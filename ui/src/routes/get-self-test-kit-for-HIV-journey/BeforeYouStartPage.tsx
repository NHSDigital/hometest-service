"use client";

import { ActionLink, Button, Card } from "nhsuk-react-components";
import { useNavigate } from "react-router-dom";

import { useContent, usePageTitle } from "@/hooks";
import FormPageLayout from "@/layouts/FormPageLayout";
import { RoutePath } from "@/lib/models/route-paths";

export default function BeforeYouStartPage() {
  const navigate = useNavigate();
  const { commonContent, "before-you-start": content } = useContent();

  usePageTitle(content.pageTitle);

  return (
    <FormPageLayout>
      <h1>{content.title}</h1>

      <Card cardType="urgent">
        <Card.Heading>{content.urgentCard.heading}</Card.Heading>
        <ul>
          <li>{content.urgentCard.hivExposureBullet}</li>
          <li>
            {`${content.urgentCard.stiSymptomsBulletPrefix} `}
            <a
              href={content.urgentCard.stiSymptomsLink.href}
              className="nhsuk-link--no-visited-state"
            >
              {content.urgentCard.stiSymptomsLink.text}
            </a>
          </li>
        </ul>

        <p>{content.urgentCard.transmissionInfo}</p>

        <ActionLink href={commonContent.links.sexualHealthClinic.href}>
          {commonContent.links.sexualHealthClinic.text}
        </ActionLink>

        <p>
          {`${content.urgentCard.aeAdvicePrefix} `}
          <a href={commonContent.links.nearestAE.href} className="nhsuk-link--no-visited-state">
            {commonContent.links.nearestAE.text}
          </a>
          {"."}
        </p>
      </Card>

      <Button onClick={() => navigate(RoutePath.GetSelfTestKitPage)}>
        {content.continueButton}
      </Button>
    </FormPageLayout>
  );
}
