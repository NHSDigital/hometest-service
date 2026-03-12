import { useCallback } from "react";

import { useThrowError } from "./useThrowError";

export function useAsyncErrorHandler<TArgs extends unknown[]>(
  handler: (...args: TArgs) => void | Promise<void>,
) {
  const throwError = useThrowError();

  return useCallback(
    (...args: TArgs) => {
      try {
        const result = handler(...args);

        if (result instanceof Promise) {
          void result.catch((error) => {
            throwError(error);
          });
        }
      } catch (error) {
        throwError(error);
      }
    },
    [handler, throwError],
  );
}
