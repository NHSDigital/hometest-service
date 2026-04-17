import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import BeforeYouStartPage from "@/routes/get-self-test-kit-for-HIV-journey/BeforeYouStartPage";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/before-you-start"]}>{children}</MemoryRouter>
);

describe("BeforeYouStartPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders the page heading", () => {
    render(<BeforeYouStartPage />, { wrapper: TestWrapper });

    expect(
      screen.getByRole("heading", { name: "Before you order a free HIV self-test kit", level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the urgent card heading", () => {
    render(<BeforeYouStartPage />, { wrapper: TestWrapper });

    expect(
      screen.getByRole("heading", { name: "Urgent advice: Go to a sexual health clinic if:" }),
    ).toBeInTheDocument();
  });

  it("renders the HIV exposure bullet", () => {
    render(<BeforeYouStartPage />, { wrapper: TestWrapper });

    expect(
      screen.getByText(
        "you think you've been exposed to HIV in the last 72 hours, as they can give you emergency medicine called PEP",
      ),
    ).toBeInTheDocument();
  });

  it("renders the STI symptoms link with the correct href", () => {
    render(<BeforeYouStartPage />, { wrapper: TestWrapper });

    const stiLink = screen.getByRole("link", {
      name: "sexually transmitted infection (STI) symptoms",
    });
    expect(stiLink).toBeInTheDocument();
    expect(stiLink).toHaveAttribute(
      "href",
      "https://www.nhs.uk/conditions/sexually-transmitted-infections-stis/",
    );
  });

  it("renders the Find a sexual health clinic ActionLink with the correct href", () => {
    render(<BeforeYouStartPage />, { wrapper: TestWrapper });

    const clinicLink = screen.getByRole("link", { name: "Find a sexual health clinic" });
    expect(clinicLink).toBeInTheDocument();
    expect(clinicLink).toHaveAttribute(
      "href",
      "https://www.nhs.uk/service-search/sexual-health-services/find-a-sexual-health-clinic/",
    );
  });

  it("renders the A&E link with the correct href", () => {
    render(<BeforeYouStartPage />, { wrapper: TestWrapper });

    const aeLink = screen.getByRole("link", { name: "your nearest A&E" });
    expect(aeLink).toBeInTheDocument();
    expect(aeLink).toHaveAttribute(
      "href",
      "https://www.nhs.uk/service-search/find-an-accident-and-emergency-service/",
    );
  });

  it("renders the Continue to order a kit button", () => {
    render(<BeforeYouStartPage />, { wrapper: TestWrapper });

    expect(screen.getByRole("button", { name: "Continue to order a kit" })).toBeInTheDocument();
  });

  it("navigates to /get-self-test-kit-for-HIV when the Continue button is clicked", () => {
    render(<BeforeYouStartPage />, { wrapper: TestWrapper });

    fireEvent.click(screen.getByRole("button", { name: "Continue to order a kit" }));

    expect(mockNavigate).toHaveBeenCalledWith("/get-self-test-kit-for-HIV");
  });

  it("renders the transmission info paragraph", () => {
    render(<BeforeYouStartPage />, { wrapper: TestWrapper });

    expect(
      screen.getByText(
        "The virus can be spread by having vaginal, anal or oral sex without a condom or by sharing needles with someone who has HIV.",
      ),
    ).toBeInTheDocument();
  });

  it("sets the document title", () => {
    render(<BeforeYouStartPage />, { wrapper: TestWrapper });

    expect(document.title).toBe("Before you order a free HIV self-test kit - HomeTest - NHS");
  });
});
