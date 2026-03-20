import { useState } from "react";

/**
 * Hook for managing page-level loading state and messaging.
 *
 * Provides a unified interface for pages to set loading state and custom messages.
 * Eliminates the need for separate `isSubmitting` / `isLoading` variables across pages.
 */

export interface UsePageLoadingReturn {
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (isLoading: boolean, message?: string) => void;
  setLoadingMessage: (message: string) => void;
}

export function usePageLoading(defaultMessage = "Submitting your order"): UsePageLoadingReturn {
  const [isLoading, setIsLoadingState] = useState(false);
  const [loadingMessage, setLoadingMessageState] = useState(defaultMessage);

  const setLoading = (loading: boolean, message?: string) => {
    setIsLoadingState(loading);
    if (message !== undefined) {
      setLoadingMessageState(message);
    }
  };

  const setLoadingMessage = (message: string) => {
    setLoadingMessageState(message);
  };

  return {
    isLoading,
    loadingMessage,
    setLoading,
    setLoadingMessage,
  };
}
