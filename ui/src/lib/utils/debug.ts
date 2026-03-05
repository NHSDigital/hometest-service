declare global {
  var __appDebug: Record<string, unknown> | undefined;
}

export function registerDebugState(slice: string, getValue: () => unknown) {
  if (process.env.NODE_ENV !== 'development') return;

  globalThis.__appDebug ??= {};
  Object.defineProperty(globalThis.__appDebug, slice, {
    get: getValue,
    configurable: true,
    enumerable: true,
  });
}

export function unregisterDebugState(slice: string) {
  if (process.env.NODE_ENV !== 'development') return;

  if (globalThis.__appDebug) {
    delete globalThis.__appDebug[slice];
  }
}
