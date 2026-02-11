"use client";

// TODO: remove console.logs

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { RoutePath } from "@/lib/models/route-paths";

export interface NavigationState {
  currentStep: string;
  stepHistory: string[];
}

interface JourneyNavigationContextType {
  currentStep: string;
  stepHistory: string[];
  goToStep: (step: string) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  clearHistory: () => void;
}

const JourneyNavigationContext = createContext<
  JourneyNavigationContextType | undefined
>(undefined);

export function JourneyNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract current step from the HIV test journey path
  const getStepFromPath = (path: string): string => {
    if (path === RoutePath.GetSelfTestKitPage)
      return "get-self-test-kit-for-HIV";
    return (
      path.replace(`${RoutePath.GetSelfTestKitPage}/`, "") ||
      "get-self-test-kit-for-HIV"
    );
  };

  const currentStep = getStepFromPath(location.pathname);

  const [navigation, setNavigation] = useState<{
    stepHistory: string[];
    lastStep: string;
  }>(() => ({
    stepHistory: [currentStep],
    lastStep: currentStep,
  }));

  let stepHistory = navigation.stepHistory;
  if (navigation.lastStep !== currentStep) {
    const newHistory =
      navigation.stepHistory[navigation.stepHistory.length - 1] === currentStep
        ? navigation.stepHistory
        : [...navigation.stepHistory, currentStep];

    stepHistory = newHistory;
    setNavigation({
      stepHistory: newHistory,
      lastStep: currentStep,
    });

    console.log(
      "[JourneyNavigationProvider] Step changed to:",
      currentStep,
      "History:",
      newHistory,
    );
  }

  const goToStep = useCallback(
    (step: string) => {
      console.log("[JourneyNavigationProvider] Going to step:", step);

      // Build journey-specific path
      const targetPath =
        step === "get-self-test-kit-for-HIV"
          ? RoutePath.GetSelfTestKitPage
          : `${RoutePath.GetSelfTestKitPage}/${step}`;

      navigate(targetPath);
    },
    [navigate],
  );

  const goBack = useCallback(() => {
    console.log("[JourneyNavigationProvider] Going back from:", currentStep);
    console.log("[JourneyNavigationProvider] Current history:", stepHistory);

    if (stepHistory.length > 1) {
      const newHistory = stepHistory.slice(0, -1);
      const previousStep = newHistory[newHistory.length - 1];

      console.log("[JourneyNavigationProvider] Going back to:", previousStep);

      setNavigation({
        stepHistory: newHistory,
        lastStep: previousStep,
      });

      navigate(-1);
    }
  }, [stepHistory, currentStep, navigate]);

  const canGoBack = useCallback(() => {
    return stepHistory.length > 1;
  }, [stepHistory.length]);

  const clearHistory = useCallback(() => {
    console.log("[JourneyNavigationProvider] Clearing history");
    setNavigation({
      stepHistory: [currentStep],
      lastStep: currentStep,
    });
  }, [currentStep]);

  return (
    <JourneyNavigationContext.Provider
      value={{
        currentStep,
        stepHistory,
        goToStep,
        goBack,
        canGoBack,
        clearHistory,
      }}
    >
      {children}
    </JourneyNavigationContext.Provider>
  );
}

export function useJourneyNavigationContext() {
  const context = useContext(JourneyNavigationContext);
  if (!context) {
    throw new Error(
      "useJourneyNavigationContext must be used within a JourneyNavigationProvider",
    );
  }
  return context;
}
