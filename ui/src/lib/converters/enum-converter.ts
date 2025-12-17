export function mapToEnum<T>(value: string | null | undefined): T | null {
  if (!value) {
    return null;
  }
  return value as T;
}
