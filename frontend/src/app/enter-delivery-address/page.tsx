"use client";

import { PageLayout } from "@/components/PageLayout";
import { Fieldset, TextInput, Button } from "nhsuk-react-components";
import Link from "next/link";

// TODO: dynamic errors based on validation

export default function EnterDeliveryAddressPage() {
  return (
    <PageLayout>
      <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-4">
        Enter your delivery address and we&apos;ll check if the kit&apos;s
        available
      </h1>

      <Fieldset>
        <TextInput
          id="postcode"
          name="postcode"
          label="Postcode"
          labelProps={{
            isPageHeading: false,
            size: "s",
          }}
          hint="For example, LS1 1AB"
          error="Enter a valid postcode"
        ></TextInput>

        <TextInput
          id="building-number-or-name"
          name="building-number-or-name"
          label="Building number or name (optional)"
          labelProps={{
            isPageHeading: false,
            size: "s",
          }}
          hint="For example, 15 or Prospect Cottage"
          error="Enter a valid building number or name"
        ></TextInput>
      </Fieldset>

      <Button>Continue</Button>

      <p className="nhsuk-body">
        <Link href="enter-address-manually">Enter address manually</Link>
      </p>
    </PageLayout>
  );
}
