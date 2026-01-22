"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, ActionLink, Button, Details } from "nhsuk-react-components";
import { PageLayout } from "@/components/PageLayout";
import { useOrderContext } from "../OrderContext";

export default function GetSelfTestKitPage() {
  const router = useRouter();
  const { updateOrderAnswers } = useOrderContext();

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
      <h1>Get a self-test kit for HIV</h1>

      <p>You can use this service if you are aged 18 or over.</p>
      <p>
        The kit is not yet available in all areas, so we&apos;ll need to check when
        you enter a postcode.
      </p>

      {/* Urgent Card */}
      <Card cardType="urgent">
        <Card.Heading>Go to a sexual health clinic if:</Card.Heading>
        <Card.Content>
          <ul>
            <li>
              you think you&apos;ve been exposed to the HIV virus in the last 72
              hours
            </li>
          </ul>

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

      {/* Inset Text */}
      <div className="nhsuk-inset-text">
        <span className="nhsuk-u-visually-hidden">Information: </span>
        <p>
          HIV antibodies take time to develop. The test is accurate if you take
          it 45 days or more after potential exposure.
        </p>
      </div>

      {/* How It Works Section */}
      <h2>How it works</h2>
      <p>
        The kit will be delivered in plain packaging, to the address you choose.
        This does not have to be your usual address.
      </p>
      <p>
        <Link href="step-by-step-guide">Blood sample step-by-step guide</Link>
      </p>
      <p>
        You&apos;ll need to prick your finger and fill a tube with blood. Then send
        it to the address in the pre-paid envelope.
      </p>

      {/* Details/Disclosure */}
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

      {/* Start Button */}
      <Button onClick={() => router.push("/enter-delivery-address")}>
        Start now
      </Button>

      {/* About Using This Service */}
      <h2>About using this service</h2>
      <p>
        By using this service, you agree to our{" "}
        <Link href="terms-and-conditions">terms of use</Link> and{" "}
        <Link href="privacy-policy">privacy policy</Link>.
      </p>

      {/* Other Options Section */}
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
