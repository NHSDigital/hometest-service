import "@testing-library/jest-dom";
import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { JourneyStepNames, RoutePath } from "@/lib/models/route-paths";
import { SESSION_STORAGE_KEYS } from "@/lib/services/session-service";
import { JourneyNavigationProvider, useJourneyNavigationContext } from "@/state/NavigationContext";

function TestWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <MemoryRouter
      initialEntries={[`${RoutePath.GetSelfTestKitPage}/${JourneyStepNames.CheckYourAnswers}`]}
    >
      <JourneyNavigationProvider>{children}</JourneyNavigationProvider>
    </MemoryRouter>
  );
}

describe("NavigationContext", () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear();
  });

  describe("JourneyNavigationProvider", () => {
    it("provides the current step as the initial history", () => {
      const { result } = renderHook(() => useJourneyNavigationContext(), {
        wrapper: TestWrapper,
      });

      expect(result.current.currentStep).toBe(JourneyStepNames.CheckYourAnswers);
      expect(result.current.stepHistory).toEqual([JourneyStepNames.CheckYourAnswers]);
      expect(result.current.returnToStep).toBeNull();
    });

    it("rehydrates persisted navigation and appends the current step when needed", () => {
      globalThis.sessionStorage.setItem(
        SESSION_STORAGE_KEYS.journeyNavigation,
        JSON.stringify({
          stepHistory: [JourneyStepNames.EnterMobileNumber],
          returnToStep: JourneyStepNames.CheckYourAnswers,
        }),
      );

      const { result } = renderHook(() => useJourneyNavigationContext(), {
        wrapper: TestWrapper,
      });

      expect(result.current.stepHistory).toEqual([
        JourneyStepNames.EnterMobileNumber,
        JourneyStepNames.CheckYourAnswers,
      ]);
      expect(result.current.returnToStep).toBe(JourneyStepNames.CheckYourAnswers);
    });

    it("resetNavigation clears in-memory navigation and storage for a redirect target", async () => {
      const { result } = renderHook(() => useJourneyNavigationContext(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setReturnToStep(JourneyStepNames.CheckYourAnswers);
      });

      await waitFor(() => {
        expect(
          globalThis.sessionStorage.getItem(SESSION_STORAGE_KEYS.journeyNavigation),
        ).not.toBeNull();
      });

      act(() => {
        result.current.resetNavigation(RoutePath.GetSelfTestKitPage);
      });

      await waitFor(() => {
        expect(result.current.currentStep).toBe(RoutePath.GetSelfTestKitPage);
      });

      expect(result.current.returnToStep).toBeNull();
      expect(result.current.stepHistory).toEqual([RoutePath.GetSelfTestKitPage]);
      expect(globalThis.sessionStorage.getItem(SESSION_STORAGE_KEYS.journeyNavigation)).toBeNull();
    });
  });

  describe("useJourneyNavigationContext", () => {
    it("throws when used outside provider", () => {
      expect(() => {
        renderHook(() => useJourneyNavigationContext());
      }).toThrow("useJourneyNavigationContext must be used within a JourneyNavigationProvider");
    });
  });
});
