import { NotifyEventCode } from "./notify-message";
import { NotifyMessageSchema } from "./notify-message-schema";

describe("NotifyMessageSchema", () => {
  const validMessage = {
    correlationId: "550e8400-e29b-41d4-a716-446655440000",
    messageReference: "550e8400-e29b-41d4-a716-446655440001",
    eventCode: NotifyEventCode.OrderConfirmed,
    nhsNumber: "1234567890",
    recipient: {
      nhsNumber: "1234567890",
      dateOfBirth: "1990-01-31",
    },
    personalisation: {
      url: "some-url",
    },
  };

  it("accepts a valid notify message", () => {
    const result = NotifyMessageSchema.safeParse(validMessage);

    expect(result.success).toBe(true);
  });

  it("rejects an invalid correlationId", () => {
    const result = NotifyMessageSchema.safeParse({
      ...validMessage,
      correlationId: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid recipient fields", () => {
    const result = NotifyMessageSchema.safeParse({
      ...validMessage,
      recipient: {
        nhsNumber: "12345",
        dateOfBirth: "31-01-1990",
      },
    });

    expect(result.success).toBe(false);
  });
});
