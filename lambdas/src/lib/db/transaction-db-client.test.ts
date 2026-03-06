import { OrderStatusCodes } from "./order-status-db";
import { TransactionService } from "./transaction-db-client";

const mockQuery = jest.fn();
const mockTransaction = jest.fn(async (fn: any) => fn({ query: mockQuery }));

jest.mock("./db-client", () => ({
  PostgresDbClient: jest.fn().mockImplementation(() => ({
    query: mockQuery,
    withTransaction: mockTransaction,
  })),
}));

describe("TransactionService", () => {
  let service: TransactionService;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockDbClient = {
      withTransaction: mockTransaction,
      close: jest.fn(),
    };
    service = new TransactionService({ dbClient: mockDbClient as any });
  });

  describe("createPatientOrderAndConsent", () => {
    const nhsNumber = "1234567890";
    const birthDate = "1990-01-01";
    const supplierId = "SUP001";
    const testCode = "TEST001";
    const correlationId = "corr-123";

    it("should create patient and order successfully", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ patient_uid: "patient-1" }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ order_uid: "order-1", order_reference: 123 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ status_id: "status-1" }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            { consent_uid: "consent-1", order_uid: "order-1", created_at: expect.any(String) },
          ],
          rowCount: 1,
        });

      const result = await service.createPatientOrderAndConsent(
        nhsNumber,
        birthDate,
        supplierId,
        testCode,
        correlationId,
        true,
      );

      expect(result).toEqual({
        orderUid: "order-1",
        orderReference: 123,
        patientUid: "patient-1",
      });
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledTimes(4);
      expect(mockQuery).toHaveBeenNthCalledWith(1, expect.any(String), [nhsNumber, birthDate]);
      expect(mockQuery).toHaveBeenNthCalledWith(2, expect.any(String), [
        supplierId,
        "patient-1",
        testCode,
        undefined,
      ]);
      expect(mockQuery).toHaveBeenNthCalledWith(3, expect.any(String), [
        "order-1",
        OrderStatusCodes.GENERATED,
        expect.any(String),
        correlationId,
      ]);
      expect(mockQuery).toHaveBeenNthCalledWith(4, expect.any(String), ["order-1"]);
    });

    it("should pass originator when provided", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ patient_uid: "patient-1" }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ order_uid: "order-1", order_reference: 123 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ status_id: "status-1" }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            { consent_uid: "consent-1", order_uid: "order-1", created_at: expect.any(String) },
          ],
          rowCount: 1,
        });

      await service.createPatientOrderAndConsent(
        nhsNumber,
        birthDate,
        supplierId,
        testCode,
        correlationId,
        true,
        "originator-1",
      );

      expect(mockQuery).toHaveBeenNthCalledWith(2, expect.any(String), [
        supplierId,
        "patient-1",
        testCode,
        "originator-1",
      ]);
    });

    it("should throw error when patient insert returns no rows", async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(
        service.createPatientOrderAndConsent(
          nhsNumber,
          birthDate,
          supplierId,
          testCode,
          correlationId,
          true,
        ),
      ).rejects.toThrow(/Failed to create patient, order and consent in database/);
    });

    it("should throw error when order insert returns no rows", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ patient_uid: "patient-1" }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      await expect(
        service.createPatientOrderAndConsent(
          nhsNumber,
          birthDate,
          supplierId,
          testCode,
          correlationId,
          true,
        ),
      ).rejects.toThrow(/Failed to create patient, order and consent in database/);
    });

    it("should throw error when order status insert returns no rows", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ patient_uid: "patient-1" }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ order_uid: "order-1", order_reference: 123 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      await expect(
        service.createPatientOrderAndConsent(
          nhsNumber,
          birthDate,
          supplierId,
          testCode,
          correlationId,
          true,
        ),
      ).rejects.toThrow(/Failed to create patient, order and consent in database/);
    });

    it("should throw error when consent insert returns no rows", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ patient_uid: "patient-1" }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ order_uid: "order-1", order_reference: 123 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ status_id: "status-1" }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      await expect(
        service.createPatientOrderAndConsent(
          nhsNumber,
          birthDate,
          supplierId,
          testCode,
          correlationId,
          true,
        ),
      ).rejects.toThrow(/Failed to create patient, order and consent in database/);
    });

    it("should throw error when database query fails", async () => {
      mockQuery.mockRejectedValue(new Error("DB failure"));

      await expect(
        service.createPatientOrderAndConsent(
          nhsNumber,
          birthDate,
          supplierId,
          testCode,
          correlationId,
          true,
        ),
      ).rejects.toThrow(/Failed to create patient, order and consent in database/);
    });

    it("should throw error when consent is false", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ patient_uid: "patient-1" }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ order_uid: "order-1", order_reference: 123 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ status_id: "status-1" }],
          rowCount: 1,
        });

      await expect(
        service.createPatientOrderAndConsent(
          nhsNumber,
          birthDate,
          supplierId,
          testCode,
          correlationId,
          false,
        ),
      ).rejects.toThrow(/Failed to create patient, order and consent in database/);
    });
  });
});
