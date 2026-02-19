import { PostgresDbClient } from "./db-client";
import { SupplierService } from "./supplier-db";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";

describe("SupplierService Integration Tests", () => {
  let container: StartedPostgreSqlContainer;
  let dbClient: PostgresDbClient;
  let supplierService: SupplierService;

  beforeAll(async () => {
    // Start a real PostgreSQL container
    container = await new PostgreSqlContainer("postgres:16-alpine")
      .withDatabase("testdb")
      .withUsername("testuser")
      .withPassword("testpass")
      .start();

    dbClient = new PostgresDbClient(container.getConnectionUri());

    // Create the schema
    await dbClient.query(`CREATE SCHEMA IF NOT EXISTS hometest`);

    // Create test tables
    await dbClient.query(`
      CREATE TABLE hometest.patient_mapping (
        patient_uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        nhs_number varchar(50) UNIQUE,
        birth_date date NOT NULL
      )
    `);

    await dbClient.query(`
      CREATE TABLE hometest.test_type (
        test_code varchar(50) PRIMARY KEY,
        description text NOT NULL
      )
    `);

    await dbClient.query(`
      CREATE TABLE hometest.supplier (
        supplier_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_name varchar(255) NOT NULL,
        service_url varchar(255) NOT NULL,
        website_url varchar(255),
        client_secret_name varchar(255) NOT NULL,
        client_id varchar(255) NOT NULL,
        oauth_token_path varchar(255),
        order_path varchar(255),
        oauth_scope varchar(255)
      )
    `);

    await dbClient.query(`
      CREATE TABLE hometest.test_order (
        order_uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_reference bigint GENERATED ALWAYS AS IDENTITY (START WITH 100000) UNIQUE,
        supplier_id uuid NOT NULL REFERENCES hometest.supplier (supplier_id),
        patient_uid uuid NOT NULL REFERENCES hometest.patient_mapping (patient_uid),
        test_code varchar(50) NOT NULL REFERENCES hometest.test_type (test_code),
        originator varchar(255),
        created_at timestamp with time zone DEFAULT current_timestamp
      )
    `);

    await dbClient.query(`
      CREATE TABLE hometest.status_type (
        status_code varchar(50) PRIMARY KEY,
        description text NOT NULL
      )
    `);

    await dbClient.query(`
      CREATE TABLE hometest.order_status (
        status_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_uid uuid NOT NULL REFERENCES hometest.test_order (order_uid) ON DELETE CASCADE,
        order_reference bigint,
        status_code varchar(50) NOT NULL REFERENCES hometest.status_type (status_code),
        created_at timestamp with time zone DEFAULT current_timestamp,
        CONSTRAINT unique_order_status_per_order UNIQUE (order_uid)
      )
    `);

    // Insert test data
    await dbClient.query(`
      INSERT INTO hometest.test_type (test_code, description)
      VALUES ('HIV', 'HIV Test')
    `);

    await dbClient.query(`
      INSERT INTO hometest.status_type (status_code, description)
      VALUES ('GENERATED', 'Order Generated'), ('DISPATCHED', 'Order Dispatched')
    `);

    await dbClient.query(`
      INSERT INTO hometest.supplier (supplier_id, supplier_name, service_url, client_secret_name, client_id)
      VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Test Supplier', 'https://test.supplier.com', 'secret-name', 'client-123')
    `);

    supplierService = new SupplierService({ dbClient });
  }, 60000); // Increase timeout for container startup

  afterAll(async () => {
    if (dbClient) {
      await dbClient.close();
    }
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await dbClient.query("DELETE FROM hometest.order_status");
    await dbClient.query("DELETE FROM hometest.test_order");
    await dbClient.query("DELETE FROM hometest.patient_mapping");
  });

  describe("updateOrderStatus - Idempotency", () => {
    it("should update status_code and created_at but not order_reference on subsequent calls", async () => {
      const nhsNumber = "9876543210";
      const birthDate = "1985-05-15";
      const supplierId = "550e8400-e29b-41d4-a716-446655440000";
      const testCode = "HIV";

      // Create initial patient, order, and status
      const result = await supplierService.createPatientAndOrderAndStatus(
        nhsNumber,
        birthDate,
        supplierId,
        testCode,
      );

      // Get initial order_status record
      const initialStatusQuery = await dbClient.query<{
        order_uid: string;
        order_reference: number;
        status_code: string;
        created_at: Date;
      }>(
        "SELECT order_uid, order_reference, status_code, created_at FROM hometest.order_status WHERE order_uid = $1",
        [result.orderUid],
      );
      expect(initialStatusQuery.rows).toHaveLength(1);
      const initialStatus = initialStatusQuery.rows[0];
      expect(initialStatus.status_code).toBe("GENERATED");
      const initialCreatedAt = initialStatus.created_at;
      const initialOrderReference = initialStatus.order_reference;

      // Wait to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update the order status
      await supplierService.updateOrderStatus(
        result.orderUid,
        result.orderReference,
        "DISPATCHED",
      );

      // Verify update behavior
      const updatedStatusQuery = await dbClient.query<{
        order_uid: string;
        order_reference: number;
        status_code: string;
        created_at: Date;
      }>(
        "SELECT order_uid, order_reference, status_code, created_at FROM hometest.order_status WHERE order_uid = $1",
        [result.orderUid],
      );
      expect(updatedStatusQuery.rows).toHaveLength(1); // Should still be only 1 record
      const updatedStatus = updatedStatusQuery.rows[0];

      // Status code should be updated
      expect(updatedStatus.status_code).toBe("DISPATCHED");

      // created_at should be updated (is later than initial)
      expect(new Date(updatedStatus.created_at).getTime()).toBeGreaterThan(
        new Date(initialCreatedAt).getTime(),
      );

      // order_reference should NOT change
      expect(updatedStatus.order_reference).toBe(initialOrderReference);

      // Verify no duplicate entries were created
      const countQuery = await dbClient.query(
        "SELECT COUNT(*) as count FROM hometest.order_status WHERE order_uid = $1",
        [result.orderUid],
      );
      expect(countQuery.rows[0].count).toBe("1");
    });
  });
});
