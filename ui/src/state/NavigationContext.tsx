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
type ResetNavigationOptions = { replace?: boolean };

// Map the current browser path back to the journey step enum used by the context.
const getStepFromPath = (path: string): Step => {
  if (path === RoutePath.GetSelfTestKitPage) {
    return RoutePath.GetSelfTestKitPage;
  }

  return (
    (path.replace(`${RoutePath.GetSelfTestKitPage}/`, "") as JourneyStepNames) ||
    RoutePath.GetSelfTestKitPage
  );
};

// Build a browser path from a journey step when navigating programmatically.
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

// The provider keeps one extra in-memory flag so resets can suppress stale history
// until the router location has caught up to the reset target.
interface JourneyNavigationState extends PersistedJourneyNavigationState {
  pendingResetToStep: Step | null;
}

const createPersistedNavigationFallback = (currentStep: Step): PersistedJourneyNavigationState => ({
  stepHistory: [currentStep],
  returnToStep: null,
});

const getHydratedStepHistory = (
  persistedState: PersistedJourneyNavigationState,
  currentStep: Step,
): Step[] => {
  return persistedState.stepHistory.length > 0 ? persistedState.stepHistory : [currentStep];
};

const appendCurrentStepIfMissing = (stepHistory: Step[], currentStep: Step): Step[] => {
  const lastStep = stepHistory.at(-1);

  return lastStep === currentStep ? stepHistory : [...stepHistory, currentStep];
};

const createInitialNavigationState = (currentStep: Step): JourneyNavigationState => {
  const persistedState = sessionService.rehydrateJourneyNavigation<PersistedJourneyNavigationState>(
    createPersistedNavigationFallback(currentStep),
  );

  return {
    stepHistory: appendCurrentStepIfMissing(
      getHydratedStepHistory(persistedState, currentStep),
      currentStep,
    ),
    returnToStep: persistedState.returnToStep,
    pendingResetToStep: null,
  };
};

const isResetInFlight = (navigationState: JourneyNavigationState, currentStep: Step): boolean => {
  return (
    navigationState.pendingResetToStep !== null &&
    currentStep !== navigationState.pendingResetToStep
  );
};

const getVisibleStepHistory = (
  navigationState: JourneyNavigationState,
  currentStep: Step,
): Step[] => {
  return isResetInFlight(navigationState, currentStep)
    ? navigationState.stepHistory
    : appendCurrentStepIfMissing(navigationState.stepHistory, currentStep);
};

const shouldClearPersistedNavigation = (
  stepHistory: Step[],
  currentStep: Step,
  returnToStep: Step | null,
): boolean => {
  const hasOnlyCurrentStep = stepHistory.length === 1 && stepHistory[0] === currentStep;

  return hasOnlyCurrentStep && returnToStep === null;
};

export interface JourneyNavigationContextType {
  currentStep: Step;
  stepHistory: Step[];
  returnToStep: Step | null;
  goToStep: (step: Step) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  clearHistory: () => void;
  resetNavigation: (step?: Step, options?: ResetNavigationOptions) => void;
  setReturnToStep: (step: Step | null) => void;
}

export const JourneyNavigationContext = createContext<JourneyNavigationContextType | undefined>(
  undefined,
);

export function JourneyNavigationProvider({ children }: Readonly<{ children: ReactNode }>) {
  const navigate = useNavigate();
  const location = useLocation();

  // The current step comes from the URL, not from React state.
  const currentStep = getStepFromPath(location.pathname);

  // This is the raw provider state. The context exposes a derived history below.
  const [navigationState, setNavigationState] = useState<JourneyNavigationState>(() =>
    createInitialNavigationState(currentStep),
  );

  const stepHistory = useMemo(
    () => getVisibleStepHistory(navigationState, currentStep),
    [currentStep, navigationState],
  );

  useEffect(() => {
    // While a reset is in flight, keep storage empty until the router reaches the
    // reset target so stale history cannot be re-persisted.
    if (isResetInFlight(navigationState, currentStep)) {
      sessionService.clearJourneyNavigation();
      return;
    }

    if (shouldClearPersistedNavigation(stepHistory, currentStep, navigationState.returnToStep)) {
      sessionService.clearJourneyNavigation();
      return;
    }

    // Persist the derived history rather than the raw state so storage matches what
    // consumers see from the context.
    sessionService.dehydrateJourneyNavigation<PersistedJourneyNavigationState>({
      stepHistory,
      returnToStep: navigationState.returnToStep,
    });
  }, [currentStep, stepHistory, navigationState]);

  useEffect(() => {
    if (
      navigationState.pendingResetToStep === null ||
      currentStep !== navigationState.pendingResetToStep
    ) {
      return;
    }

    // Clear the pending reset flag only after the router has landed on the target.
    queueMicrotask(() => {
      setNavigationState((previousNavigationState) => {
        if (previousNavigationState.pendingResetToStep === null) {
          return previousNavigationState;
        }

        return {
          ...previousNavigationState,
          pendingResetToStep: null,
        };
      });
    });
  }, [currentStep, navigationState.pendingResetToStep]);

  const goToStep = useCallback(
    (step: Step) => {
      navigate(getPathForStep(step));
    },
    [navigate],
  );

  const goBack = useCallback(() => {
    if (stepHistory.length > 1) {
      const newHistory = stepHistory.slice(0, -1);

      // Trim the in-memory history before asking the router to go back.
      setNavigationState((previousNavigationState) => ({
        ...previousNavigationState,
        stepHistory: newHistory,
      }));

      navigate(-1);
    }
  }, [stepHistory, navigate]);

  const canGoBack = useCallback(() => {
    return stepHistory.length > 1;
  }, [stepHistory.length]);

  const clearHistory = useCallback(() => {
    setNavigationState((previousNavigationState) => ({
      ...previousNavigationState,
      stepHistory: [currentStep],
      pendingResetToStep: null,
    }));
  }, [currentStep]);

  const resetNavigation = useCallback(
    (step: Step = currentStep, options?: ResetNavigationOptions) => {
      // Reset both the visible navigation history and the return target. If the
      // target step differs from the current route, keep a temporary guard until
      // the router reaches that target.
      setNavigationState({
        stepHistory: [step],
        returnToStep: null,
        pendingResetToStep: step === currentStep ? null : step,
      });

      sessionService.clearJourneyNavigation();

      // Let callers optionally combine reset + redirect in one provider-owned action.
      if (step !== currentStep || options?.replace === true) {
        navigate(getPathForStep(step), { replace: options?.replace });
      }
    },
    [currentStep, navigate],
  );

  const setReturnToStep = useCallback((step: Step | null) => {
    setNavigationState((previousNavigationState) => ({
      ...previousNavigationState,
      returnToStep: step,
      pendingResetToStep: null,
    }));
  }, []);

  const contextValue = useMemo(
    () => ({
      currentStep,
      stepHistory,
      returnToStep: navigationState.returnToStep,
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
      navigationState.returnToStep,
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
