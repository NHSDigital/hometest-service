"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { registerDebugState } from "@/lib/utils/debug";
import { useLocation, useNavigate } from "react-router-dom";

import { RoutePath } from "@/lib/models/route-paths";

export interface NavigationState {
  currentStep: string;
  stepHistory: string[];
}

interface JourneyNavigationContextType {
  currentStep: string;
  stepHistory: string[];
  returnToStep: string | null;
  goToStep: (step: string) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  clearHistory: () => void;
  setReturnToStep: (step: string | null) => void;
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

  const [returnToStep, setReturnToStep] = useState<string | null>(null);

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
  }

  const goToStep = useCallback(
    (step: string) => {
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
    if (stepHistory.length > 1) {
      const newHistory = stepHistory.slice(0, -1);
      const previousStep = newHistory[newHistory.length - 1];

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

  useEffect(() => {
    registerDebugState('navigation', () => ({ currentStep, stepHistory, returnToStep }));
  }, [currentStep, stepHistory, returnToStep]);

  const clearHistory = useCallback(() => {
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
        returnToStep,
        goToStep,
        goBack,
        canGoBack,
        clearHistory,
        setReturnToStep,
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
