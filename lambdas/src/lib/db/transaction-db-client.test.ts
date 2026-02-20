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

  describe("createPatientAndOrderAndStatus", () => {
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
        });

      const result = await service.createPatientAndOrderAndStatus(
        nhsNumber,
        birthDate,
        supplierId,
        testCode,
        correlationId,
      );

      expect(result).toEqual({
        orderUid: "order-1",
        orderReference: 123,
        patientUid: "patient-1",
      });
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(mockQuery).toHaveBeenNthCalledWith(1, expect.any(String), [
        nhsNumber,
        birthDate,
      ]);
      expect(mockQuery).toHaveBeenNthCalledWith(2, expect.any(String), [
        supplierId,
        "patient-1",
        testCode,
        undefined,
      ]);
      expect(mockQuery).toHaveBeenNthCalledWith(3, expect.any(String), [
        "order-1",
        123,
        "GENERATED",
        expect.any(String),
        correlationId,
      ]);
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
        });

      await service.createPatientAndOrderAndStatus(
        nhsNumber,
        birthDate,
        supplierId,
        testCode,
        correlationId,
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
        service.createPatientAndOrderAndStatus(
          nhsNumber,
          birthDate,
          supplierId,
          testCode,
          correlationId,
        ),
      ).rejects.toThrow(/Failed to create patient and order in database/);
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
        service.createPatientAndOrderAndStatus(
          nhsNumber,
          birthDate,
          supplierId,
          testCode,
          correlationId,
        ),
      ).rejects.toThrow(/Failed to create patient and order in database/);
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
        service.createPatientAndOrderAndStatus(
          nhsNumber,
          birthDate,
          supplierId,
          testCode,
          correlationId,
        ),
      ).rejects.toThrow(/Failed to create patient and order in database/);
    });

    it("should throw error when database query fails", async () => {
      mockQuery.mockRejectedValue(new Error("DB failure"));

      await expect(
        service.createPatientAndOrderAndStatus(
          nhsNumber,
          birthDate,
          supplierId,
          testCode,
          correlationId,
        ),
      ).rejects.toThrow(/Failed to create patient and order in database/);
    });
  });
});
