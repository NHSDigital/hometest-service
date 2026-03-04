declare global {
  var __appDebug: Record<string, () => unknown> | undefined;
}

export function registerDebugState(slice: string, getValue: () => unknown) {
  if (process.env.NODE_ENV !== 'development') return;

  globalThis.__appDebug ??= {};
  globalThis.__appDebug[slice] = getValue;
}
