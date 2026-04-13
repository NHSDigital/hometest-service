import { z } from "zod";

import { NotifyEventCode, type NotifyMessage, type NotifyRecipient } from "./notify-message";

export const NotifyRecipientSchema: z.ZodType<NotifyRecipient> = z.object({
  nhsNumber: z
    .string()
    .regex(/^\d{10}$/, "Invalid NHS number format")
    .describe("Recipient NHS number"),
  dateOfBirth: z.iso.date().describe("Recipient date of birth"),
});

export const NotifyMessageSchema: z.ZodType<NotifyMessage> = z.object({
  correlationId: z.uuid("Invalid correlationId format"),
  messageReference: z.uuid("Invalid messageReference format"),
  eventCode: z.enum(NotifyEventCode),
  recipient: NotifyRecipientSchema,
  personalisation: z.record(z.string(), z.unknown()).optional(),
});
