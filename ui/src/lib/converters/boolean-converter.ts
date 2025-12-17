export function convertToNullableBool(
  value: boolean | null | undefined
): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value;
}
