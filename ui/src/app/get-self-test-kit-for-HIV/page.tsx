"use client";

import Link from "next/link";
import { Card, ActionLink, Button, Details } from "nhsuk-react-components";
import { PageLayout } from "@/components/PageLayout";

// TODO: Replace [n] with actual number of working days from API etc

export default function GetSelfTestKitPage() {

  return (
    <PageLayout>
      <h1>Get a self-test kit for HIV</h1>

      <p>You can use this service if you are aged 18 or over.</p>
      <p>
        The kit is not yet available in all areas, so we&apos;ll need to check when
        you enter a postcode.
      </p>

      <Card cardType="urgent">
        <Card.Heading>Go to a sexual health clinic if:</Card.Heading>
        <Card.Content>
          <p style={{ listStyle: 'disc', marginLeft: '1.2em', display: 'list-item' }}>
            you think you&apos;ve been exposed to the HIV virus in the last 72
            hours
          </p>

          <p>
            Clinic staff can offer you emergency HIV medicine, which may stop
            you getting infected.
          </p>

          <ActionLink href="https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic/">
            Find a sexual health clinic
          </ActionLink>

          <p>
            You can also get emergency HIV medicine from {" "}
            <a href="https://www.nhs.uk/service-search/find-an-accident-and-emergency-service/">
              your nearest A&amp;E
            </a>
            .
          </p>
        </Card.Content>
      </Card>

      <div className="nhsuk-inset-text">
        <span className="nhsuk-u-visually-hidden">Information: </span>
        <p>
          HIV antibodies take time to develop. The test is accurate if you take
          it 45 days or more after potential exposure.
        </p>
      </div>

      <h2>How it works</h2>
      <p>
        The kit will be delivered in plain packaging, to the address you choose, within [n] working days.
        This does not have to be your usual address.
      </p>
      <p>
        <Link href="step-by-step-guide">Blood sample step-by-step guide</Link>
      </p>
      <p>
        You&apos;ll need to prick your finger and fill a tube with blood. Then send
        it to the address in the pre-paid envelope.
      </p>

      <Details>
        <Details.Summary>
          Who my information is shared with
        </Details.Summary>
        <Details.Text>
          Your contact details will only be shared with the kit supplier, who
          is a trusted NHS partner. Your contact details and test result will
          not be shared with anyone else, including your GP, unless you give
          consent.
        </Details.Text>
      </Details>

      <Button href="enter-delivery-address">
        Start now
      </Button>

      <h2>About using this service</h2>
      <p>
        By using this service, you agree to our{" "}
        <Link href="terms-and-conditions">terms of use</Link> and{" "}
        <Link href="privacy-policy">privacy policy</Link>.
      </p>

      <h2>Other options to home testing, and more support</h2>
      <p>
        Instead of doing the test at home, you can go to{" "}
        <a href="https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic/">
          your nearest sexual health clinic
        </a>{" "}
        to get tested.
      </p>
      <p>
        If you&apos;re concerned about other sexual health issues, you can{" "}
        <a href="https://www.nhs.uk/nhs-services/sexual-health-services/">
          find sexual health services near you
        </a>
        .
      </p>
      <p>
        <a href="https://www.nhs.uk/conditions/hiv-and-aids/">
          Learn more about HIV and AIDS
        </a>
      </p>
    </PageLayout>
  );
}
