import { z } from "zod";

export const getOrderQueryParamsSchema = z.looseObject({
  order_id: z.uuid("Invalid order id format").toLowerCase(),
  nhs_number: z
    .string()
    .transform((val) => val.replaceAll(/\s/g, ""))
    .refine((val) => /^\d{10}$/.test(val), {
      message: "NHS number must be exactly 10 digits",
    }),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in yyyy-mm-dd format")
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Date of birth must be a valid date",
    })
    .transform((val) => new Date(val)),
});
