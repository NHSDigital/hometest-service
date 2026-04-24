export const extractIdFromReference = (reference: string): string | null => {
  const parts = reference.split("/");

  return parts.length === 2 ? parts[1] : null;
};
