import {
  type DbRetryOptions,
  executeDbOperationWithRetry,
  isTransientDatabaseError,
} from "./db-retry";

describe("db-retry", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("isTransientDatabaseError", () => {
    it("should return true for transient postgres errors", () => {
      const error = Object.assign(new Error("database restart"), {
        code: "57P01",
      });

      expect(isTransientDatabaseError(error)).toBe(true);
    });

    it("should return true for postgres connection-exception class errors", () => {
      const error = Object.assign(new Error("connection failure"), {
        code: "08006",
      });

      expect(isTransientDatabaseError(error)).toBe(true);
    });

    it("should return false for unrelated operator-intervention postgres errors", () => {
      const error = Object.assign(new Error("query canceled"), {
        code: "57014",
      });

      expect(isTransientDatabaseError(error)).toBe(false);
    });

    it("should return false for pool timeout errors", () => {
      expect(isTransientDatabaseError(new Error("timeout expired"))).toBe(false);
    });
  });

  describe("executeDbOperationWithRetry", () => {
    const retryOptions: Partial<DbRetryOptions> = {
      maxRetries: 2,
      initialDelayMs: 10,
      backoffFactor: 2,
      maxDelayMs: 100,
      jitter: false,
    };

    it("should retry transient database errors and resolve", async () => {
      const transientError = Object.assign(new Error("connection reset"), {
        code: "ECONNRESET",
      });
      const operation = jest
        .fn<Promise<string>, []>()
        .mockRejectedValueOnce(transientError)
        .mockRejectedValueOnce(transientError)
        .mockResolvedValue("ok");

      const promise = executeDbOperationWithRetry(operation, retryOptions);

      await Promise.resolve();
      expect(operation).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(10);
      expect(operation).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(20);

      await expect(promise).resolves.toBe("ok");
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should throw immediately for non-retryable errors", async () => {
      const operation = jest.fn<Promise<string>, []>().mockRejectedValue(new Error("bad sql"));

      await expect(executeDbOperationWithRetry(operation, retryOptions)).rejects.toThrow("bad sql");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should stop retrying after the maximum number of retries", async () => {
      const transientError = Object.assign(new Error("server closed the connection unexpectedly"), {
        code: "08006",
      });
      const operation = jest.fn<Promise<string>, []>().mockRejectedValue(transientError);

      const promise = executeDbOperationWithRetry(operation, retryOptions);
      const expectedRejection = expect(promise).rejects.toThrow(
        "server closed the connection unexpectedly",
      );

      await Promise.resolve();
      expect(operation).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(10);
      expect(operation).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(20);

      await expectedRejection;
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should fall back to the non-jittered delay when custom options produce an invalid jitter range", async () => {
      const transientError = Object.assign(new Error("connection reset"), {
        code: "ECONNRESET",
      });
      const operation = jest
        .fn<Promise<string>, []>()
        .mockRejectedValueOnce(transientError)
        .mockResolvedValue("ok");

      const promise = executeDbOperationWithRetry(operation, {
        maxRetries: 1,
        initialDelayMs: 0,
        backoffFactor: 2,
        maxDelayMs: 0,
        jitter: true,
      });

      await Promise.resolve();
      expect(operation).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(0);

      await expect(promise).resolves.toBe("ok");
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });
});
