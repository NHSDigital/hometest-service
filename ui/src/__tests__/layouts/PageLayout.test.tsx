import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";

import PageLayout from "@/layouts/PageLayout";

describe("PageLayout", () => {
  it("renders children content", () => {
    render(
      <PageLayout>
        <div>Test content</div>
      </PageLayout>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders a Back link when onBackButtonClick is provided", () => {
    const onBackButtonClick = jest.fn();

    render(
      <PageLayout onBackButtonClick={onBackButtonClick}>
        <div>Test content</div>
      </PageLayout>,
    );

    const backLink = screen.getByText("Back");
    expect(backLink).toBeInTheDocument();
  });

  it("calls onBackButtonClick when Back link is clicked", () => {
    const onBackButtonClick = jest.fn();

    render(
      <PageLayout onBackButtonClick={onBackButtonClick}>
        <div>Test content</div>
      </PageLayout>,
    );

    const backLink = screen.getByText("Back");
    fireEvent.click(backLink);

    expect(onBackButtonClick).toHaveBeenCalledTimes(1);
  });

  it("does not render Back link when onBackButtonClick is not provided", () => {
    render(
      <PageLayout>
        <div>Test content</div>
      </PageLayout>,
    );

    expect(screen.queryByText("Back")).not.toBeInTheDocument();
  });
});
