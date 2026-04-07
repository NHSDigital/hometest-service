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

interface JourneyNavigationState extends PersistedJourneyNavigationState {
  pendingResetToStep: Step | null;
}

export interface JourneyNavigationContextType {
  currentStep: Step;
  stepHistory: Step[];
  returnToStep: Step | null;
  goToStep: (step: Step) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  clearHistory: () => void;
  resetNavigation: (step?: Step, options?: { replace?: boolean }) => void;
  setReturnToStep: (step: Step | null) => void;
}

export const JourneyNavigationContext = createContext<JourneyNavigationContextType | undefined>(
  undefined,
);

export function JourneyNavigationProvider({ children }: Readonly<{ children: ReactNode }>) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentStep = getStepFromPath(location.pathname);

  const [navigation, setNavigation] = useState<JourneyNavigationState>(() => {
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
      pendingResetToStep: null,
    };
  });

  const stepHistory = useMemo(() => {
    if (navigation.pendingResetToStep !== null && currentStep !== navigation.pendingResetToStep) {
      return navigation.stepHistory;
    }

    const lastStep = navigation.stepHistory.at(-1);

    return lastStep === currentStep
      ? navigation.stepHistory
      : [...navigation.stepHistory, currentStep];
  }, [currentStep, navigation.pendingResetToStep, navigation.stepHistory]);

  useEffect(() => {
    if (navigation.pendingResetToStep !== null && currentStep !== navigation.pendingResetToStep) {
      sessionService.clearJourneyNavigation();
      return;
    }

    const hasOnlyCurrentStep = stepHistory.length === 1 && stepHistory[0] === currentStep;

    if (hasOnlyCurrentStep && navigation.returnToStep === null) {
      sessionService.clearJourneyNavigation();
      return;
    }

    sessionService.dehydrateJourneyNavigation<PersistedJourneyNavigationState>({
      stepHistory,
      returnToStep: navigation.returnToStep,
    });
  }, [currentStep, stepHistory, navigation.pendingResetToStep, navigation.returnToStep]);

  useEffect(() => {
    if (navigation.pendingResetToStep === null || currentStep !== navigation.pendingResetToStep) {
      return;
    }

    queueMicrotask(() => {
      setNavigation((previousNavigation) => {
        if (previousNavigation.pendingResetToStep === null) {
          return previousNavigation;
        }

        return {
          ...previousNavigation,
          pendingResetToStep: null,
        };
      });
    });
  }, [currentStep, navigation.pendingResetToStep]);

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
      pendingResetToStep: null,
    }));
  }, [currentStep]);

  const resetNavigation = useCallback(
    (step: Step = currentStep, options?: { replace?: boolean }) => {
      setNavigation({
        stepHistory: [step],
        returnToStep: null,
        pendingResetToStep: step === currentStep ? null : step,
      });

      sessionService.clearJourneyNavigation();

      if (step !== currentStep || options?.replace === true) {
        navigate(getPathForStep(step), { replace: options?.replace });
      }
    },
    [currentStep, navigate],
  );

  const setReturnToStep = useCallback((step: Step | null) => {
    setNavigation((previousNavigation) => ({
      ...previousNavigation,
      returnToStep: step,
      pendingResetToStep: null,
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
      resetNavigation,
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
      resetNavigation,
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
