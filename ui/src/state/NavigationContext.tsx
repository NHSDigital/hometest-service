"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { JourneyStepNames, RoutePath } from "@/lib/models/route-paths";
import sessionService from "@/lib/services/session-service";

type Step = JourneyStepNames | RoutePath.GetSelfTestKitPage;

const getStepFromPath = (path: string): Step => {
  if (path === RoutePath.GetSelfTestKitPage) {
    return RoutePath.GetSelfTestKitPage;
  }

  return (
    (path.replace(`${RoutePath.GetSelfTestKitPage}/`, "") as JourneyStepNames) ||
    RoutePath.GetSelfTestKitPage
  );
};

const getPathForStep = (step: Step): string => {
  return step === RoutePath.GetSelfTestKitPage
    ? RoutePath.GetSelfTestKitPage
    : `${RoutePath.GetSelfTestKitPage}/${step}`;
};

export interface NavigationState {
  currentStep: Step;
  stepHistory: Step[];
}

interface PersistedJourneyNavigationState {
  stepHistory: Step[];
  returnToStep: Step | null;
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

  const currentStep = getStepFromPath(location.pathname);

  const [navigation, setNavigation] = useState<PersistedJourneyNavigationState>(() => {
    const persistedState =
      sessionService.rehydrateJourneyNavigation<PersistedJourneyNavigationState>({
        stepHistory: [currentStep],
        returnToStep: null,
      });

    const stepHistory =
      persistedState.stepHistory.length > 0 ? persistedState.stepHistory : [currentStep];
    const lastStep = stepHistory.at(-1);

    return {
      stepHistory: lastStep === currentStep ? stepHistory : [...stepHistory, currentStep],
      returnToStep: persistedState.returnToStep,
    };
  });

  const stepHistory = useMemo(() => {
    const lastStep = navigation.stepHistory.at(-1);

    return lastStep === currentStep
      ? navigation.stepHistory
      : [...navigation.stepHistory, currentStep];
  }, [navigation.stepHistory, currentStep]);

  useEffect(() => {
    const hasOnlyCurrentStep = stepHistory.length === 1 && stepHistory[0] === currentStep;

    if (hasOnlyCurrentStep && navigation.returnToStep === null) {
      sessionService.clearJourneyNavigation();
      return;
    }

    sessionService.dehydrateJourneyNavigation<PersistedJourneyNavigationState>({
      stepHistory,
      returnToStep: navigation.returnToStep,
    });
  }, [currentStep, stepHistory, navigation.returnToStep]);

  const goToStep = useCallback(
    (step: Step) => {
      navigate(getPathForStep(step));
    },
    [navigate],
  );

  const goBack = useCallback(() => {
    if (stepHistory.length > 1) {
      const newHistory = stepHistory.slice(0, -1);

      setNavigation((previousNavigation) => ({
        ...previousNavigation,
        stepHistory: newHistory,
      }));

      navigate(-1);
    }
  }, [stepHistory, navigate]);

  const canGoBack = useCallback(() => {
    return stepHistory.length > 1;
  }, [stepHistory.length]);

  const clearHistory = useCallback(() => {
    setNavigation((previousNavigation) => ({
      ...previousNavigation,
      stepHistory: [currentStep],
    }));
  }, [currentStep]);

  const setReturnToStep = useCallback((step: Step | null) => {
    setNavigation((previousNavigation) => ({
      ...previousNavigation,
      returnToStep: step,
    }));
  }, []);

  const contextValue = useMemo(
    () => ({
      currentStep,
      stepHistory,
      returnToStep: navigation.returnToStep,
      goToStep,
      goBack,
      canGoBack,
      clearHistory,
      setReturnToStep,
    }),
    [
      currentStep,
      stepHistory,
      navigation.returnToStep,
      goToStep,
      goBack,
      canGoBack,
      clearHistory,
      setReturnToStep,
    ],
  );

  return (
    <JourneyNavigationContext.Provider value={contextValue}>
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
