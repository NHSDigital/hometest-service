"use client";

import { ReactNode, createContext, useCallback, useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { JourneyStepNames, RoutePath } from "@/lib/models/route-paths";

type Step = JourneyStepNames | RoutePath.GetSelfTestKitPage;

export interface NavigationState {
  currentStep: Step;
  stepHistory: Step[];
}

export interface JourneyNavigationContextType {
  currentStep: Step;
  stepHistory: Step[];
  returnToStep: Step | null;
  goToStep: (step: Step) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  clearHistory: () => void;
  setReturnToStep: (step: Step | null) => void;
}

export const JourneyNavigationContext = createContext<JourneyNavigationContextType | undefined>(
  undefined,
);

export function JourneyNavigationProvider({ children }: Readonly<{ children: ReactNode }>) {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract current step from the HIV test journey path
  const getStepFromPath = (path: string): Step => {
    if (path === RoutePath.GetSelfTestKitPage) return RoutePath.GetSelfTestKitPage;
    return (
      (path.replace(`${RoutePath.GetSelfTestKitPage}/`, "") as JourneyStepNames) ||
      RoutePath.GetSelfTestKitPage
    );
  };

  const currentStep = getStepFromPath(location.pathname);

  const [navigation, setNavigation] = useState<{
    stepHistory: Step[];
    lastStep: Step;
  }>(() => ({
    stepHistory: [currentStep],
    lastStep: currentStep,
  }));

  const [returnToStep, setReturnToStep] = useState<Step | null>(null);

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
        step === RoutePath.GetSelfTestKitPage
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
    throw new Error("useJourneyNavigationContext must be used within a JourneyNavigationProvider");
  }
  return context;
}
