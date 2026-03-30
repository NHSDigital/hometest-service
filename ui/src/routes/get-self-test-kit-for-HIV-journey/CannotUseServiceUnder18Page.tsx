"use client";

import { ActionLink } from "nhsuk-react-components";

import { FeedbackSection } from "@/components/FeedbackSection";
import { OpensInNewTabLink } from "@/components/OpensInNewTabLink";
import { useContent } from "@/hooks";
import FormPageLayout from "@/layouts/FormPageLayout";
import { RoutePath } from "@/lib/models/route-paths";
import { useCreateOrderContext, useJourneyNavigationContext } from "@/state";

export const HARD_CODED_CLINIC_DATA = {
  name: "Sexual Health Clinic - Kendal",
  address: "Kentwood Clinic, Gillinggate Centre, Kendal, Cumbria, LA9 4JE",
  phone: "01228 608989",
  distance: "1.1 miles away",
  directionsLink:
    "https://www.google.com/maps/search/Kentwood+Clinic,+Gillinggate+Centre,+Kendal,+Cumbria,+LA9+4JE/@54.328,-2.746,17z",
  detailsLink:
    "https://www.nhs.uk/services/service-directory/locala-sexual-health/N10507429?gsdServiceId=734",
};

export const NHS_LINKS = {
  findClinic:
    "https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic",
  findYoungPeoplesServices:
    "https://www.nhs.uk/service-search/sexual-health-services/find-young-peoples-sexual-health-services",
};

export default function CannotUseServiceUnder18Page() {
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();
  const { "cannot-use-service-under-18": content } = useContent();
  const { orderAnswers } = useCreateOrderContext();

  const postcode = orderAnswers.deliveryAddress?.postcode;

  const findAnotherClinicHref = postcode
    ? `${NHS_LINKS.findClinic}/results?location=${encodeURIComponent(postcode)}`
    : NHS_LINKS.findClinic;

  const findYoungPeopleSexualHealthServicesHref = postcode
    ? `${NHS_LINKS.findYoungPeoplesServices}/results?location=${encodeURIComponent(postcode)}`
    : NHS_LINKS.findYoungPeoplesServices;

  return (
    <FormPageLayout
      showBackButton
      onBackButtonClick={() => {
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep(RoutePath.GetSelfTestKitPage);
        }
      }}
    >
      <div>
        <h1>{content.title}</h1>

        <p>{content.intro}</p>

        <p className="nhsuk-body-s nhsuk-u-margin-bottom-2">{HARD_CODED_CLINIC_DATA.distance}</p>

        <h2 className="nhsuk-heading-m">
          <OpensInNewTabLink
            linkHref={HARD_CODED_CLINIC_DATA.detailsLink}
            linkText={HARD_CODED_CLINIC_DATA.name}
          />
        </h2>

        <p className="nhsuk-body">{HARD_CODED_CLINIC_DATA.address}</p>

        <p className="nhsuk-body">
          {content.phoneLabel}{" "}
          <a href={`tel:${HARD_CODED_CLINIC_DATA.phone.replaceAll(/\s+/g, "")}`}>
            {HARD_CODED_CLINIC_DATA.phone}
          </a>
        </p>

        <p className="nhsuk-body">
          <OpensInNewTabLink
            linkHref={HARD_CODED_CLINIC_DATA.directionsLink}
            linkText={content.directionsLinkText}
          />
        </p>

        <hr className="nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5" />

        <ActionLink href={findAnotherClinicHref} target="_blank" rel="noopener noreferrer">
          {content.findAnotherClinicLinkText}
        </ActionLink>

        <h2>{content.moreOptionsHeading}</h2>

        <p>
          {content.youngPeopleServicesText}{" "}
          <OpensInNewTabLink
            linkHref={findYoungPeopleSexualHealthServicesHref}
            linkText={content.youngPeopleServicesLinkText}
          />
        </p>

        <p>
          <OpensInNewTabLink
            linkHref={content.learnMoreLinkHref}
            linkText={content.learnMoreLinkText}
          />
        </p>

        <FeedbackSection />
      </div>
    </FormPageLayout>
  );
}
