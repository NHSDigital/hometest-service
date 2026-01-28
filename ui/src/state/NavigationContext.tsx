"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

export interface NavigationState {
  currentStep: string;
  stepHistory: string[];
}

interface NavigationContextType {
  currentStep: string;
  stepHistory: string[];
  goToStep: (step: string) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  clearHistory: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = pathname.split("/").filter(Boolean).join("/") || "get-self-test-kit-for-HIV";

  const [navigation, setNavigation] = useState<{
    stepHistory: string[];
    lastStep: string;
  }>(() => ({
    stepHistory: [currentStep],
    lastStep: currentStep,
  }));

  let stepHistory = navigation.stepHistory;
  if (navigation.lastStep !== currentStep) {
    const newHistory = navigation.stepHistory[navigation.stepHistory.length - 1] === currentStep
      ? navigation.stepHistory
      : [...navigation.stepHistory, currentStep];

    stepHistory = newHistory;
    setNavigation({
      stepHistory: newHistory,
      lastStep: currentStep,
    });

    console.log("[NavigationProvider] Step changed to:", currentStep, "History:", newHistory);
  }

  const goToStep = useCallback(
    (step: string) => {
      console.log("[NavigationProvider] Going to step:", step);
      const path = step === "get-self-test-kit-for-HIV" ? "/get-self-test-kit-for-HIV" : `/${step}`;
      router.push(path);
    },
    [router]
  );

  const goBack = useCallback(() => {
    console.log("[NavigationProvider] Going back from:", currentStep);
    console.log("[NavigationProvider] Current history:", stepHistory);

    if (stepHistory.length > 1) {
      const newHistory = stepHistory.slice(0, -1);
      const previousStep = newHistory[newHistory.length - 1];

      console.log("[NavigationProvider] Going back to:", previousStep);

      setNavigation({
        stepHistory: newHistory,
        lastStep: previousStep,
      });

      router.back();
    }
  }, [stepHistory, currentStep, router]);

  const canGoBack = useCallback(() => {
    return stepHistory.length > 1;
  }, [stepHistory.length]);

  const clearHistory = useCallback(() => {
    console.log("[NavigationProvider] Clearing history");
    setNavigation({
      stepHistory: [currentStep],
      lastStep: currentStep,
    });
  }, [currentStep]);

  return (
    <NavigationContext.Provider
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
    </NavigationContext.Provider>
  );
}

export function useNavigationContext() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error(
      "useNavigationContext must be used within a NavigationProvider"
    );
  }
  return context;
}
