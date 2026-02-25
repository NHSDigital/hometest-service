import { z } from "zod";

export const generateReadableError = (error: z.ZodError) => {
  let errorMessage = '';
  error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errorMessage += `${path}: ${issue.message}\n`;
  });
  return errorMessage.trim();
};
