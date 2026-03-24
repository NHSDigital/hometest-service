"use client";

import { useEffect } from "react";
import { useCreateOrderContext, useJourneyNavigationContext, usePostcodeLookup } from "@/state";
import { registerDebugState, unregisterDebugState } from "./debug";

function JourneyDevtoolsInner() {
  const { orderAnswers } = useCreateOrderContext();
  const { currentStep, stepHistory, returnToStep } = useJourneyNavigationContext();
  const { postcode, addresses, selectedAddress, lookupResultsStatus, error } = usePostcodeLookup();

  useEffect(() => {
    registerDebugState("order", () => orderAnswers);
    registerDebugState("navigation", () => ({ currentStep, stepHistory, returnToStep }));
    registerDebugState("postcode", () => ({
      postcode,
      addresses,
      selectedAddress,
      lookupResultsStatus,
      error,
    }));
    return () => {
      unregisterDebugState("order");
      unregisterDebugState("navigation");
      unregisterDebugState("postcode");
    };
  }, [
    orderAnswers,
    currentStep,
    stepHistory,
    returnToStep,
    postcode,
    addresses,
    selectedAddress,
    lookupResultsStatus,
    error,
  ]);

  return null;
}

export function JourneyDevtools() {
  if (process.env.NODE_ENV !== "development") return null;
  return <JourneyDevtoolsInner />;
}
