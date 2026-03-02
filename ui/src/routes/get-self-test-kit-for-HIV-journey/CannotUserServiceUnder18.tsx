import PageLayout from "@/layouts/PageLayout";
import { useJourneyNavigationContext } from "@/state/NavigationContext";
import { ActionLink } from "nhsuk-react-components";

export default function CannotUseServiceUnder18Page() {
  const { goToStep, goBack, stepHistory } = useJourneyNavigationContext();

  return (
    <PageLayout
      showBackButton
      onBackButtonClick={() => {
        if (stepHistory.length > 1) {
          goBack();
        } else {
          goToStep("get-self-test-kit-for-HIV");
        }
      }}
    >
      <div>
        <h1>You cannot use this service as you are under 18</h1>

        <p>To get tested for HIV, go to your nearest sexual health clinic, which is:</p>

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

        <hr className="nhsuk-u-margin-top-5 nhsuk-u-margin-bottom-5"></hr>

        <ActionLink href="https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic/results?location=HD1%201AB">
          Find another sexual health clinic
        </ActionLink>

        <h2>More options and information</h2>

        <p>
          You can also use the{" "}
          <a href="https://www.nhs.uk/service-search/sexual-health-services/find-young-peoples-sexual-health-services">
            NHS find young people&#39;s sexual health services
          </a>
          .
        </p>

        <p>
          <a href="https://www.nhs.uk/conditions/hiv-and-aids/">Learn more about HIV and AIDS</a>
        </p>

        <div
          className="nhsuk-grid-row nhsuk-u-padding-top-4 nhsuk-u-padding-bottom-4 nhsuk-u-background-color-blue"
          style={{ backgroundColor: "#D2E1EF" }}
        >
          <div className="nhsuk-grid-column-full flex-center-container background-red">
            <p className="nhsuk-u-margin-bottom-0">
              This is a new service. Help us improve it and <a href="">give your feedback</a>.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
