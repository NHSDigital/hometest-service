import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import SuppliersPrivacyPolicyPage from "@/routes/SuppliersPrivacyPolicyPage";
import SuppliersTermsConditionsPage from "@/routes/SuppliersTermsConditionsPage";
import BeforeYouStartPage from "@/routes/get-self-test-kit-for-HIV-journey/BeforeYouStartPage";
import GetSelfTestKitPage from "@/routes/get-self-test-kit-for-HIV-journey/GetSelfTestKitPage";
import { CreateOrderProvider, JourneyNavigationProvider } from "@/state";

function renderJourneyRoutes(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <JourneyNavigationProvider>
        <CreateOrderProvider>
          <Routes>
            <Route path="/before-you-start" element={<BeforeYouStartPage />} />
            <Route path="/get-self-test-kit-for-HIV" element={<GetSelfTestKitPage />} />
          </Routes>
        </CreateOrderProvider>
      </JourneyNavigationProvider>
    </MemoryRouter>,
  );
}

function renderSupplierPrivacyPolicyRoute(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/suppliers-privacy-policy" element={<SuppliersPrivacyPolicyPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderSupplierTermsConditionsRoute(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/suppliers-terms-conditions" element={<SuppliersTermsConditionsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("page titles", () => {
  it("updates the document title when navigating between journey views", async () => {
    renderJourneyRoutes("/before-you-start");

    expect(document.title).toBe(
      "Before you order a free HIV self-test kit – HIV Home Test Service – NHS",
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue to order a kit" }));

    await waitFor(() => {
      expect(document.title).toBe("Order a free HIV self-test kit – HIV Home Test Service – NHS");
    });

    expect(
      screen.getByRole("heading", { name: "Order a free HIV self-test kit", level: 1 }),
    ).toBeInTheDocument();
  });

  it("sets the document title for the supplier privacy policy view", () => {
    renderSupplierPrivacyPolicyRoute("/suppliers-privacy-policy?supplier=preventx");

    expect(document.title).toBe("Preventx privacy policy – HIV Home Test Service – NHS");
    expect(
      screen.getByRole("heading", { name: "Preventx privacy policy", level: 1 }),
    ).toBeInTheDocument();
  });

  it("sets the document title for the supplier terms of use view", () => {
    renderSupplierTermsConditionsRoute("/suppliers-terms-conditions?supplier=preventx");

    expect(document.title).toBe("Preventx terms of use – HIV Home Test Service – NHS");
    expect(
      screen.getByRole("heading", { name: "Preventx terms of use", level: 1 }),
    ).toBeInTheDocument();
  });
});
