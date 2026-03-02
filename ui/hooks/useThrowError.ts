import { useState } from "react";

export function useThrowError() {
  const [error, setError] = useState<unknown>(null);

  if (error !== null) {
    throw error;
  }

  return (nextError: unknown) => {
    setError(() => nextError);
  };
}
