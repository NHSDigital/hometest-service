import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import FormPageLayout from "@/layouts/FormPageLayout";

describe("FormPageLayout", () => {
  it("renders without crashing", () => {
    render(
      <FormPageLayout>
        <div>Test content</div>
      </FormPageLayout>,
    );
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders children correctly", () => {
    const testText = "Hello, World!";
    render(
      <FormPageLayout>
        <p>{testText}</p>
      </FormPageLayout>,
    );
    expect(screen.getByText(testText)).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    render(
      <FormPageLayout>
        <h1>Heading</h1>
        <p>Paragraph</p>
        <button>Button</button>
      </FormPageLayout>,
    );
    expect(screen.getByText("Heading")).toBeInTheDocument();
    expect(screen.getByText("Paragraph")).toBeInTheDocument();
    expect(screen.getByText("Button")).toBeInTheDocument();
  });

  it("has main element with correct role and id", () => {
    render(
      <FormPageLayout>
        <div>Content</div>
      </FormPageLayout>,
    );
    const mainElement = screen.getByRole("main");
    expect(mainElement).toHaveAttribute("id", "maincontent");
  });

  it("applies nhsuk-width-container class to container", () => {
    const { container } = render(
      <FormPageLayout>
        <div>Content</div>
      </FormPageLayout>,
    );
    const widthContainer = container.querySelector(".nhsuk-width-container");
    expect(widthContainer).toBeInTheDocument();
  });

  it("applies nhsuk-main-wrapper class to main element", () => {
    const { container } = render(
      <FormPageLayout>
        <div>Content</div>
      </FormPageLayout>,
    );
    const mainWrapper = container.querySelector(".nhsuk-main-wrapper");
    expect(mainWrapper).toBeInTheDocument();
  });

  it("applies nhsuk-grid-row class to grid row", () => {
    const { container } = render(
      <FormPageLayout>
        <div>Content</div>
      </FormPageLayout>,
    );
    const gridRow = container.querySelector(".nhsuk-grid-row");
    expect(gridRow).toBeInTheDocument();
  });

  it("applies nhsuk-grid-column-two-thirds class to grid column", () => {
    const { container } = render(
      <FormPageLayout>
        <div>Content</div>
      </FormPageLayout>,
    );
    const gridColumn = container.querySelector(".nhsuk-grid-column-two-thirds");
    expect(gridColumn).toBeInTheDocument();
  });

  it("nests elements in correct DOM hierarchy", () => {
    render(
      <FormPageLayout>
        <span data-testid="child">Child content</span>
      </FormPageLayout>,
    );
    const child = screen.getByTestId("child");
    const parent = child.parentElement;
    expect(parent).toHaveClass("nhsuk-grid-column-two-thirds");
    expect(parent?.parentElement).toHaveClass("nhsuk-grid-row");
  });

  it("renders with empty children", () => {
    const { container } = render(<FormPageLayout>{null}</FormPageLayout>);
    const mainElement = container.querySelector("main");
    expect(mainElement).toBeInTheDocument();
  });
});
