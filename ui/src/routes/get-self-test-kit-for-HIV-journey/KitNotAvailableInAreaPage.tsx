"use client";

import { JourneyStepNames } from "@/lib/models/route-paths";
import PageLayout from "@/layouts/PageLayout";
import { useJourneyNavigationContext } from "@/state";

export default function KitNotAvailableInAreaPage() {
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();

  return (
    <PageLayout
      showBackButton
      onBackButtonClick={() => {
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep(JourneyStepNames.EnterDeliveryAddress);
        }
      }}
    >
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">
        Free HIV self-test kits are not available in your area using this
        service
      </h1>
      <p className="nhsuk-body">There are other options to get an HIV test.</p>
      <h2>Contact your nearest sexual health clinic</h2>
      <p className="nhsuk-body">
        To get tested for HIV, go to your nearest sexual health clinic, which
        is:
      </p>
      <p className="nhsuk-body-s nhsuk-u-margin-bottom-2">1.1 miles away</p>

      <h2 className="nhsuk-heading-m">
        <a href="https://www.nhs.uk/services/service-directory/locala-sexual-health/N10507429?gsdServiceId=734">
          Sexual health clinic name
        </a>
      </h2>
      <p className="nhsuk-body">17/21 Dod Street, Poplar, London, E14 7EG</p>
      <p className="nhsuk-body">
        Phone: <a href="">0121 123 1234</a>
      </p>
      <p className="nhsuk-body">
        <a
          href="https://www.google.com/maps/search/Locala+Sexual+Health+Princess+Royal+Community+Health+Centre+Greenhead+Road++Huddersfield+West+Yorkshire+HD1+4EW/@53.646385192871094,-1.790373921394348,17z"
          target="_blank"
        >
          Get directions (opens in Google Maps)
        </a>
      </p>
      <hr className="nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5" />

      <a
        className="nhsuk-action-link"
        href="https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic/results?location=HD1%201AB"
      >
        <svg
          className="nhsuk-icon nhsuk-icon--arrow-right-circle"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          focusable="false"
          aria-hidden="true"
        >
          <path d="M12 2a10 10 0 0 0-10 9h11.7l-4-4a1 1 0 0 1 1.5-1.4l5.6 5.7a1 1 0 0 1 0 1.4l-5.6 5.7a1 1 0 0 1-1.5 0 1 1 0 0 1 0-1.4l4-4H2A10 10 0 1 0 12 2z"></path>
        </svg>

        <span className="nhsuk-action-link__text">
          Find another sexual health clinic
        </span>
      </a>

      <h2>More options and information</h2>
      <p>
        <a href="https://www.nhs.uk/conditions/hiv-and-aids/">
          Learn more about HIV and AIDS
        </a>
      </p>

      <div
        className="nhsuk-grid-row nhsuk-u-margin-bottom-0 nhsuk-u-margin-top-6 nhsuk-u-padding-top-4"
        style={{ backgroundColor: "#D2E1EF" }}
      >
        <div className="nhsuk-grid-column-full flex-center-container">
          <p>
            This is a new service. Help us improve it and{" "}
            <a href="">give your feedback</a>.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
