import { z } from "zod";

export const generateReadableError = (error: z.ZodError) => {
  return z.prettifyError(error).replace(/(?:\u2716 |\r?\n )/g, '');
};
