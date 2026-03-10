import { useState, useCallback } from "react";

export function useThrowError() {
  const [error, setError] = useState<unknown>(null);

  if (error !== null) {
    throw error;
  }

  return useCallback((nextError: unknown) => {
    setError(() => nextError);
  }, []);
}
