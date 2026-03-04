import { ConsentRow, ConsentService } from "./consent-db";

const mockQuery = jest.fn();

jest.mock("./db-client", () => ({
  PostgresDbClient: jest.fn().mockImplementation(() => ({
    query: mockQuery,
  })),
}));

describe("ConsentService", () => {
  let service: ConsentService;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockDbClient = {
      query: mockQuery,
      close: jest.fn(),
    };
    service = new ConsentService(mockDbClient as any);
  });

  describe("createConsent", () => {
    const orderUid = "550e8400-e29b-41d4-a716-446655440000";

    it("should insert a consent record and return the row when consent is true", async () => {
      const mockConsent: ConsentRow = {
        consent_uid: "consent-1",
        order_uid: orderUid,
        created_at: "2024-01-01T00:00:00Z",
      };

      mockQuery.mockResolvedValue({ rows: [mockConsent], rowCount: 1 });

      const result = await service.createConsent(orderUid, true);

      expect(result).toEqual(mockConsent);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO consent"), [
        orderUid,
      ]);
    });

    it("should throw when consent is false", async () => {
      await expect(service.createConsent(orderUid, false)).rejects.toThrow(
        `Consent must be true to record consent for orderId ${orderUid}`,
      );
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw when the insert returns no rows", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(service.createConsent(orderUid, true)).rejects.toThrow(
        `Failed to record consent for orderId ${orderUid}`,
      );
    });

    it("should throw on database failure", async () => {
      mockQuery.mockRejectedValue(new Error("DB connection failed"));

      await expect(service.createConsent(orderUid, true)).rejects.toThrow(
        `Failed to record consent for orderId ${orderUid}`,
      );
    });
  });

  describe("getConsentByOrderUid", () => {
    const orderUid = "550e8400-e29b-41d4-a716-446655440000";

    it("should return the consent row for a known order", async () => {
      const mockConsent: ConsentRow = {
        consent_uid: "consent-1",
        order_uid: orderUid,
        created_at: "2024-01-01T00:00:00Z",
      };

      mockQuery.mockResolvedValue({ rows: [mockConsent], rowCount: 1 });

      const result = await service.getConsentByOrderUid(orderUid);

      expect(result).toEqual(mockConsent);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT"), [orderUid]);
    });

    it("should return null when no consent record exists for the order", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await service.getConsentByOrderUid(orderUid);

      expect(result).toBeNull();
    });

    it("should throw on database failure", async () => {
      mockQuery.mockRejectedValue(new Error("DB connection failed"));

      await expect(service.getConsentByOrderUid(orderUid)).rejects.toThrow(
        `Failed to fetch consent for orderId ${orderUid}`,
      );
    });
  });
});
