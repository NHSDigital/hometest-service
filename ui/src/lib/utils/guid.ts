import { z } from "zod";

export function isValidGuid(value: string): boolean {
  const result = z.uuid().safeParse(value);
  return result.success;
}
