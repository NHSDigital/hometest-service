import { z } from "zod";

// Validate YYYY-MM-DD format
const BirthdateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Birthdate must be in YYYY-MM-DD format");

export function isUnder18(birthdate: string): boolean {
  const validDateString = BirthdateSchema.parse(birthdate);

  const [year, month, day] = validDateString.split("-").map(Number);

  const dob = new Date(year, month - 1, day);

  if (isNaN(dob.getTime())) throw new Error("Invalid birthdate");

  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();

  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

  if (!hasHadBirthdayThisYear) age--;

  return age < 18;
}
