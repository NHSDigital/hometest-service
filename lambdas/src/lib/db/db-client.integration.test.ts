import { PostgresDbClient } from "./db-client";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { postgresConnection } from "./connection-string-provider";

describe("PostgresDbClient Integration Tests", () => {
  let container: StartedPostgreSqlContainer;
  let client: PostgresDbClient;
  const secretsClient = {
    getSecretValue: jest.fn(),
    getSecretString: jest.fn(),
  };

  beforeAll(async () => {
    // Start a real PostgreSQL container
    container = await new PostgreSqlContainer("postgres:17.7-alpine")
      .withDatabase("testdb")
      .withUsername("testuser")
      .withPassword("testpass")
      .start();

    const connectionUri = new URL(container.getConnectionUri());
    const password = decodeURIComponent(connectionUri.password);
    secretsClient.getSecretValue.mockResolvedValue(password);

    client = new PostgresDbClient(
      postgresConnection(
        {
          username: decodeURIComponent(connectionUri.username),
          address: connectionUri.hostname,
          port: connectionUri.port,
          database: connectionUri.pathname.replace("/", ""),
          schema: "public",
          passwordSecretName: "postgres-db-password",
        },
        secretsClient,
      ),
      {
        enabled: false,
      }
    );

    // Create a test table
    await client.query(`
      CREATE TABLE test_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100)
      )
    `);
  }, 60000); // Increase timeout for container startup

  afterAll(async () => {
    if (client) {
      await client.close();
    }
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await client.query("DELETE FROM test_users");
  });

  // ALPHA: consider calling postgres more directly in some tests to verify connection pooling and transaction behavior more deeply, rather than relying solely on the client abstraction. This could help identify any issues with connection management or transaction handling that might not be apparent through the client interface alone.

  describe("Transaction Atomicity", () => {
    it("should rollback all changes when transaction fails", async () => {
      // Verify table is empty
      const before = await client.query("SELECT COUNT(*) as count FROM test_users");
      expect(before.rows[0].count).toBe("0");

      // Try a transaction that will fail
      await expect(
        client.withTransaction(async (tx) => {
          await tx.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
            "Alice",
            "alice@example.com",
          ]);
          await tx.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
            "Bob",
            "bob@example.com",
          ]);
          await tx.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
            "Charlie",
            "charlie@example.com",
          ]);
          // Force failure
          throw new Error("Intentional failure to test rollback");
        }),
      ).rejects.toThrow("Intentional failure to test rollback");

      // Verify nothing was committed - table should still be empty
      const after = await client.query("SELECT COUNT(*) as count FROM test_users");
      expect(after.rows[0].count).toBe("0");
    });

    it("should commit all changes when transaction succeeds", async () => {
      await client.withTransaction(async (tx) => {
        await tx.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
          "Alice",
          "alice@example.com",
        ]);
        await tx.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
          "Bob",
          "bob@example.com",
        ]);
        await tx.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
          "Charlie",
          "charlie@example.com",
        ]);
      });

      // Verify all records were committed
      const result = await client.query("SELECT * FROM test_users ORDER BY name");
      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].name).toBe("Alice");
      expect(result.rows[1].name).toBe("Bob");
      expect(result.rows[2].name).toBe("Charlie");
    });

    it("should maintain isolation between transaction and outside queries", async () => {
      // Insert a record outside transaction
      await client.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
        "Dave",
        "dave@example.com",
      ]);

      await client.withTransaction(async (tx) => {
        // Insert inside transaction
        await tx.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
          "Eve",
          "eve@example.com",
        ]);

        // Query inside transaction should see both
        const txResult = await tx.query("SELECT COUNT(*) as count FROM test_users");
        expect(txResult.rows[0].count).toBe("2");
      });

      // After commit, both should be visible
      const finalResult = await client.query("SELECT COUNT(*) as count FROM test_users");
      expect(finalResult.rows[0].count).toBe("2");
    });

    it("should rollback on constraint violation", async () => {
      await expect(
        client.withTransaction(async (tx) => {
          await tx.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
            "Frank",
            "frank@example.com",
          ]);
          // This should violate NOT NULL constraint
          await tx.query("INSERT INTO test_users (email) VALUES ($1)", ["george@example.com"]);
        }),
      ).rejects.toThrow();

      // Verify nothing was committed
      const result = await client.query("SELECT COUNT(*) as count FROM test_users");
      expect(result.rows[0].count).toBe("0");
    });

    it("should support nested withTransaction calls", async () => {
      await client.withTransaction(async (tx) => {
        await tx.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
          "Henry",
          "henry@example.com",
        ]);

        // Nested transaction should use same connection
        await tx.withTransaction(async (nestedTx) => {
          await nestedTx.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
            "Iris",
            "iris@example.com",
          ]);
        });
      });

      // Both inserts should be committed
      const result = await client.query("SELECT COUNT(*) as count FROM test_users");
      expect(result.rows[0].count).toBe("2");
    });

    it("should rollback all changes if nested operation fails", async () => {
      await expect(
        client.withTransaction(async (tx) => {
          await tx.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
            "Jack",
            "jack@example.com",
          ]);

          await tx.withTransaction(async (nestedTx) => {
            await nestedTx.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
              "Kate",
              "kate@example.com",
            ]);
            throw new Error("Nested failure");
          });
        }),
      ).rejects.toThrow("Nested failure");

      // Nothing should be committed
      const result = await client.query("SELECT COUNT(*) as count FROM test_users");
      expect(result.rows[0].count).toBe("0");
    });
  });

  describe("Query Operations", () => {
    it("should handle concurrent queries correctly", async () => {
      const promises = [
        client.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
          "User1",
          "user1@example.com",
        ]),
        client.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
          "User2",
          "user2@example.com",
        ]),
        client.query("INSERT INTO test_users (name, email) VALUES ($1, $2)", [
          "User3",
          "user3@example.com",
        ]),
      ];

      await Promise.all(promises);

      const result = await client.query("SELECT COUNT(*) as count FROM test_users");
      expect(result.rows[0].count).toBe("3");
    });
  });
});
