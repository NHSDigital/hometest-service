import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

test.describe(
  "Alternative Service Page - Find another sexual health clinic link should include postcode in the URL",
  {
    tag: ["@ui"],
  },
  () => {
    test.use({
      errorCaptureOptions: {
        failOnNetworkError: false,
        failOnConsoleError: false,
      },
    });

    const normalize = (value: string): string => {
      const decoded = decodeURIComponent(value).replace(/\+/g, " ");
      return decoded.replace(/[^a-z0-9]/gi, "").toLowerCase();
    };

    const isPostcodePresentInUrl = (href: string, baseUrl: string, postcode: string): boolean => {
      const url = new URL(href, baseUrl);
      const expected = normalize(postcode);

      return (
        normalize(url.toString()).includes(expected) ||
        [...url.searchParams.values()].some((value) => normalize(value).includes(expected))
      );
    };

    const goToAlternativeServicePage = async (
      unavailablePostcode: string,
      homeTestStartPage: {
        navigate: () => Promise<void>;
        clickStartNowButton: () => Promise<void>;
      },
      findAddressPage: {
        fillPostCodeAndContinue: (args: {
          addressLine1: string;
          addressLine2: string;
          townCity: string;
          postCode: string;
        }) => Promise<void>;
      },
      selectDeliveryAddressPage: {
        waitUntilPageLoad: () => Promise<void>;
        selectAddressAndContinue: () => Promise<void>;
      },
      howComfortablePrickingFingerPage: {
        waitUntilPageLoad: () => Promise<void>;
        selectNoOptionAndContinue: () => Promise<void>;
      },
      goToClinicPage: {
        page: {
          url: () => string;
        };
        waitUntilPageLoad: () => Promise<void>;
      },
    ): Promise<void> => {
      await homeTestStartPage.navigate();
      await homeTestStartPage.clickStartNowButton();
      await findAddressPage.fillPostCodeAndContinue({
        addressLine1: "",
        addressLine2: "",
        townCity: "",
        postCode: unavailablePostcode,
      });
      await selectDeliveryAddressPage.waitUntilPageLoad();
      await selectDeliveryAddressPage.selectAddressAndContinue();

      if (!goToClinicPage.page.url().includes("/get-self-test-kit-for-HIV/go-to-clinic")) {
        await howComfortablePrickingFingerPage.waitUntilPageLoad();
        await howComfortablePrickingFingerPage.selectNoOptionAndContinue();
      }

      await goToClinicPage.waitUntilPageLoad();
    };

    test("should include postcode in Find another sexual health clinic link", async ({
      homeTestStartPage,
      findAddressPage,
      selectDeliveryAddressPage,
      howComfortablePrickingFingerPage,
      goToClinicPage,
    }) => {
      const unavailablePostcode = "TN37 7PT";

      await goToAlternativeServicePage(
        unavailablePostcode,
        homeTestStartPage,
        findAddressPage,
        selectDeliveryAddressPage,
        howComfortablePrickingFingerPage,
        goToClinicPage,
      );

      const href = await goToClinicPage.getFindAnotherSexualHealthClinicLinkUrl();
      expect(isPostcodePresentInUrl(href, goToClinicPage.page.url(), unavailablePostcode)).toBe(
        true,
      );
    });

    test("should open Find another sexual health clinic link in a new tab", async ({
      homeTestStartPage,
      findAddressPage,
      selectDeliveryAddressPage,
      howComfortablePrickingFingerPage,
      goToClinicPage,
    }) => {
      const unavailablePostcode = "TN37 7PT";

      await goToAlternativeServicePage(
        unavailablePostcode,
        homeTestStartPage,
        findAddressPage,
        selectDeliveryAddressPage,
        howComfortablePrickingFingerPage,
        goToClinicPage,
      );

      const [popup] = await Promise.all([
        goToClinicPage.page.waitForEvent("popup"),
        goToClinicPage.clickFindAnotherSexualHealthClinicLink(),
      ]);

      await popup.waitForURL(
        "**/service-search/sexual-health-services/find-a-sexual-health-clinic/**",
      );
      expect(
        isPostcodePresentInUrl(popup.url(), goToClinicPage.page.url(), unavailablePostcode),
      ).toBe(true);
    });

    test("should open Learn more about HIV and AIDS link in a new tab", async ({
      homeTestStartPage,
      findAddressPage,
      selectDeliveryAddressPage,
      howComfortablePrickingFingerPage,
      goToClinicPage,
    }) => {
      const unavailablePostcode = "TN37 7PT";

      await goToAlternativeServicePage(
        unavailablePostcode,
        homeTestStartPage,
        findAddressPage,
        selectDeliveryAddressPage,
        howComfortablePrickingFingerPage,
        goToClinicPage,
      );

      const popup = await goToClinicPage.clickLearnMoreHIVAidsLink(
        "https://www.nhs.uk/conditions/hiv-and-aids/**",
      );

      await expect(popup).toHaveURL(/https:\/\/www\.nhs\.uk\/conditions\/hiv-and-aids\/?/);
    });
  },
);
