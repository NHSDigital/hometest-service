import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { JourneyNavigationProvider, useJourneyNavigationContext } from "@/state/NavigationContext";
import { RoutePath, JourneyStepNames } from "@/lib/models/route-paths";

const CurrentStepDisplay = () => {
  const { currentStep } = useJourneyNavigationContext();
  return <span data-testid="current-step">{currentStep}</span>;
};

xdescribe("JourneyNavigationProvider - getStepFromPath", () => {
  const stepValues = Object.values(JourneyStepNames).filter(
    (step) => step !== JourneyStepNames.GetSelfTestKitPage,
  );

  stepValues.forEach((step) => {
    it(`should return ${step} for path "${RoutePath.GetSelfTestKitPage}/${step}"`, async () => {
      render(
        <MemoryRouter initialEntries={[`${RoutePath.GetSelfTestKitPage}/${step}`]}>
          <JourneyNavigationProvider>
            <CurrentStepDisplay />
          </JourneyNavigationProvider>
        </MemoryRouter>,
      );

      const stepElement = await screen.findByTestId("current-step");

      expect(stepElement.textContent).toBe(step);
    });
  });

  it("should fallback to GetSelfTestKitPage for invalid path", async () => {
    render(
      <MemoryRouter initialEntries={[`${RoutePath.GetSelfTestKitPage}/invalid-step`]}>
        <JourneyNavigationProvider>
          <CurrentStepDisplay />
        </JourneyNavigationProvider>
      </MemoryRouter>,
    );

    const stepElement = await screen.findByTestId("current-step");

    expect(stepElement.textContent).toBe(JourneyStepNames.GetSelfTestKitPage);
  });
});
