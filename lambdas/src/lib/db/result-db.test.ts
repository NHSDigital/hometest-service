import { Commons } from "../commons";
import { ResultStatus } from "../types/status";
import { DBClient } from "./db-client";
import { ResultService } from "./result-db";

const mockQuery = jest.fn();

const mockDbClient: DBClient = {
  query: mockQuery,
  close: jest.fn().mockResolvedValue(undefined),
  withTransaction: jest.fn(),
};

const mockCommons: Commons = {
  logError: jest.fn(),
  logInfo: jest.fn(),
  logDebug: jest.fn(),
};

const orderUid = "order-123";
const correlationId = "corr-xyz";

describe("ResultService", () => {
  let resultService: ResultService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
    resultService = new ResultService(mockDbClient, mockCommons);
  });

  describe("updateResultStatus", () => {
    it("should execute the expected SQL statement with the correct parameters", async () => {
      await resultService.updateResultStatus(
        orderUid,
        ResultStatus.Result_Available,
        correlationId,
      );

      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO result_status"),
        [orderUid, ResultStatus.Result_Available, correlationId],
      );
    });

    it("should rethrow if the database query fails", async () => {
      const mockError = new Error("Database error");
      mockQuery.mockRejectedValue(mockError);

      await expect(
        resultService.updateResultStatus(orderUid, ResultStatus.Result_Available, correlationId),
      ).rejects.toThrow("Database error");
    });

    it("should handle idempotent updates correctly", async () => {
      // Simulate a conflict due to duplicate correlation ID
      mockQuery.mockResolvedValue({ rowCount: 0 }); // No rows inserted due to conflict

      await resultService.updateResultStatus(
        orderUid,
        ResultStatus.Result_Available,
        correlationId,
      );

      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO result_status"),
        [orderUid, ResultStatus.Result_Available, correlationId],
      );
    });
  });
});
