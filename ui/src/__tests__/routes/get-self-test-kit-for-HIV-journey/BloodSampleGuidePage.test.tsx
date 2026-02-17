import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import BloodSampleGuidePage from "@/routes/get-self-test-kit-for-HIV-journey/BloodSampleGuidePage";
import { CreateOrderProvider } from "@/state/OrderContext";
import { JourneyNavigationProvider } from "@/state/NavigationContext";
import { MemoryRouter } from "react-router-dom";

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/blood-sample-guide"]}>
    <JourneyNavigationProvider>
      <CreateOrderProvider>{children}</CreateOrderProvider>
    </JourneyNavigationProvider>
  </MemoryRouter>
);

describe("BloodSampleGuidePage", () => {
  it("renders without crashing", () => {
    render(<BloodSampleGuidePage />, { wrapper: TestWrapper });
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders the main heading", () => {
    render(<BloodSampleGuidePage />, { wrapper: TestWrapper });

    const header = screen.getByRole("heading", {
      name: "Blood sample step-by-step guide",
      level: 1,
    });
    expect(header).toBeInTheDocument();
  });

  it("renders the 'What's in the kit' details section", () => {
    render(<BloodSampleGuidePage />, { wrapper: TestWrapper });

    const summary = screen.getByText("What's in the kit");
    expect(summary).toBeInTheDocument();
  });

  it("renders the kit contents list items", () => {
    render(<BloodSampleGuidePage />, { wrapper: TestWrapper });

    expect(screen.getByText("Instructions")).toBeInTheDocument();
    expect(screen.getByText("Blood sample tube")).toBeInTheDocument();
    expect(screen.getByText("Alcohol wipe")).toBeInTheDocument();
    expect(screen.getByText("Lancets")).toBeInTheDocument();
    expect(screen.getByText("Plaster")).toBeInTheDocument();
  });

  it("renders the 'Tips before you start' details section", () => {
    render(<BloodSampleGuidePage />, { wrapper: TestWrapper });

    const summary = screen.getByText("Tips before you start");
    expect(summary).toBeInTheDocument();
  });

  it("renders the tips list items", () => {
    render(<BloodSampleGuidePage />, { wrapper: TestWrapper });

    expect(
      screen.getByText(/Drink a big glass of water at least 30 minutes/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Do the test after a shower or bath/)).toBeInTheDocument();
    expect(
      screen.getByText(/Read the instructions in full before starting/)
    ).toBeInTheDocument();
  });

  it("renders the kit contents image with correct alt text", () => {
    render(<BloodSampleGuidePage />, { wrapper: TestWrapper });

    const image = screen.getByAltText("Image showing the contents of the kit");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute(
      "src",
      "/images/self-sample-steps/self-sample-kit-contents.jpg"
    );
  });

  it("renders step headings", () => {
    render(<BloodSampleGuidePage />, { wrapper: TestWrapper });

    expect(
      screen.getByRole("heading", { name: "Step 1: Get ready", level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Step 2: Prepare your finger", level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Step 3: Prick your finger", level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Step 4: Collect the blood", level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Step 5: Fill the tube", level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Step 6: Seal and mix the tube", level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Step 7: Pack and post", level: 2 })
    ).toBeInTheDocument();
  });

  it("renders step images with correct src attributes", () => {
    render(<BloodSampleGuidePage />, { wrapper: TestWrapper });

    const step1Image = screen.getByAltText("Person opening blood sample tube");
    expect(step1Image).toBeInTheDocument();
    expect(step1Image).toHaveAttribute(
      "src",
      "/images/self-sample-steps/self-sample-step1.jpg"
    );

    const step2Image = screen.getByAltText("Person wiping finger");
    expect(step2Image).toBeInTheDocument();
    expect(step2Image).toHaveAttribute(
      "src",
      "/images/self-sample-steps/self-sample-step2.jpg"
    );

    const step3Image = screen.getByAltText("Person pricking finger");
    expect(step3Image).toBeInTheDocument();
    expect(step3Image).toHaveAttribute(
      "src",
      "/images/self-sample-steps/self-sample-step3.jpg"
    );

    const step4Image = screen.getByAltText("Person dripping blood into a sample tube");
    expect(step4Image).toBeInTheDocument();
    expect(step4Image).toHaveAttribute(
      "src",
      "/images/self-sample-steps/self-sample-step4.jpg"
    );

    const step5Image = screen.getByAltText("Blood sample tube filled with blood");
    expect(step5Image).toBeInTheDocument();
    expect(step5Image).toHaveAttribute(
      "src",
      "/images/self-sample-steps/self-sample-step5.jpg"
    );

    const step6Image = screen.getByAltText("Person turning tube upside down 5 times");
    expect(step6Image).toBeInTheDocument();
    expect(step6Image).toHaveAttribute(
      "src",
      "/images/self-sample-steps/self-sample-step6.jpg"
    );

    const step7Image = screen.getByAltText("Person sealing sample in box");
    expect(step7Image).toBeInTheDocument();
    expect(step7Image).toHaveAttribute(
      "src",
      "/images/self-sample-steps/self-sample-step7.jpg"
    );
  });

  it("renders step captions", () => {
    render(<BloodSampleGuidePage />, { wrapper: TestWrapper });

    expect(
      screen.getByText(/Wash your hands using warm water and soap/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Choose a finger from the hand you don't write with/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Remove the cap from the lancet/)).toBeInTheDocument();
    expect(screen.getByText(/Keep your hand hanging down below waist level/)).toBeInTheDocument();
    expect(screen.getByText(/Aim to fill the tube to the top line marked 600/)).toBeInTheDocument();
    expect(
      screen.getByText(/Hold a clean tissue or cotton pad against your fingertip/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Place your blood sample tube into the protective packaging/)
    ).toBeInTheDocument();
  });
});
