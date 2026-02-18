import { PostgresDbClient } from "./db-client";
import { Pool } from "pg";

jest.mock("pg", () => {
  const mPool = {
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe("PostgresDbClient", () => {
  let client: PostgresDbClient;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    client = new PostgresDbClient(
      "postgresql://test:test@localhost:5432/testdb",
    );
    mockPool = (client as unknown as { pool: jest.Mocked<Pool> }).pool;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("query", () => {
    it("should execute query and return rows and rowCount", async () => {
      const mockResult = {
        rows: [{ id: 1, name: "Test" }],
        rowCount: 1,
      };
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await client.query(
        "SELECT * FROM users WHERE id = $1",
        [1],
      );

      expect(result).toEqual({
        rows: [{ id: 1, name: "Test" }],
        rowCount: 1,
      });
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE id = $1",
        [1],
      );
    });

    it("should handle queries with no values", async () => {
      const mockResult = {
        rows: [{ count: 5 }],
        rowCount: 1,
      };
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await client.query("SELECT COUNT(*) FROM users");

      expect(result.rows).toEqual([{ count: 5 }]);
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT COUNT(*) FROM users",
        undefined,
      );
    });

    it("should handle empty result sets", async () => {
      const mockResult = {
        rows: [],
        rowCount: 0,
      };
      (mockPool.query as jest.Mock).mockResolvedValue(mockResult);

      const result = await client.query(
        "SELECT * FROM users WHERE id = $1",
        [999],
      );

      expect(result.rows).toEqual([]);
      expect(result.rowCount).toBe(0);
    });

    it("should propagate errors from pool.query", async () => {
      const error = new Error("Connection failed");
      (mockPool.query as jest.Mock).mockRejectedValue(error);

      await expect(client.query("SELECT * FROM users")).rejects.toThrow(
        "Connection failed",
      );
    });
  });

  describe("close", () => {
    it("should close the pool connection", async () => {
      (mockPool.end as jest.Mock).mockResolvedValue(undefined);

      await client.close();

      expect(mockPool.end).toHaveBeenCalledTimes(1);
    });

    it("should propagate errors from pool.end", async () => {
      const error = new Error("Failed to close pool");
      (mockPool.end as jest.Mock).mockRejectedValue(error);

      await expect(client.close()).rejects.toThrow("Failed to close pool");
    });
  });
});
