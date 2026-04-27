import { z } from "zod";

export const SessionLoginBodySchema = z.object({
  code: z.string().min(1, "code is required"),
});

export type SessionLoginBody = z.infer<typeof SessionLoginBodySchema>;
