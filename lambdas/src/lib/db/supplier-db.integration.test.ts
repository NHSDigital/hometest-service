import { SupplierService } from "./supplier-db";
import { PostgresDbClient } from "./db-client";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";

describe("SupplierService Integration Tests", () => {
  let container: StartedPostgreSqlContainer;
  let client: PostgresDbClient;
  let supplierService: SupplierService;

  beforeAll(async () => {
    // Start a real PostgreSQL container
    container = await new PostgreSqlContainer("postgres:16-alpine")
      .withDatabase("testdb")
      .withUsername("testuser")
      .withPassword("testpass")
      .start();

    client = new PostgresDbClient(container.getConnectionUri());
    supplierService = new SupplierService({ dbClient: client });

    // Create the schema
    await client.query(`
      CREATE SCHEMA hometest;
      SET search_path TO hometest;

      CREATE TABLE patient_mapping (
        patient_uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        nhs_number varchar(50) UNIQUE,
        birth_date date NOT NULL
      );

      CREATE TABLE test_type (
        test_code varchar(50) PRIMARY KEY,
        description text NOT NULL
      );

      CREATE TABLE supplier (
        supplier_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_name varchar(255) NOT NULL,
        service_url varchar(255) NOT NULL,
        website_url varchar(255),
        client_secret_name varchar(255) NOT NULL,
        client_id varchar(255) NOT NULL,
        oauth_token_path varchar(255),
        order_path varchar(255),
        oauth_scope varchar(255)
      );

      CREATE TABLE la_supplier_offering (
        offering_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_id uuid REFERENCES supplier (supplier_id),
        test_code varchar(50) REFERENCES test_type (test_code),
        la_code varchar(10) NOT NULL,
        effective_from timestamp with time zone DEFAULT current_timestamp,
        CONSTRAINT unique_la_offering UNIQUE (la_code, supplier_id, test_code)
      );

      CREATE TABLE test_order (
        order_uid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_reference bigint GENERATED ALWAYS AS IDENTITY (START WITH 100000) UNIQUE,
        supplier_id uuid NOT NULL REFERENCES supplier (supplier_id),
        patient_uid uuid NOT NULL REFERENCES patient_mapping (patient_uid),
        test_code varchar(50) NOT NULL REFERENCES test_type (test_code),
        originator varchar(255),
        created_at timestamp with time zone DEFAULT current_timestamp
      );

      CREATE TABLE status_type (
        status_code varchar(50) PRIMARY KEY,
        description text NOT NULL
      );

      CREATE TABLE order_status (
        status_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_uid uuid NOT NULL REFERENCES test_order (order_uid) ON DELETE CASCADE,
        order_reference bigint,
        status_code varchar(50) NOT NULL REFERENCES status_type (status_code),
        created_at timestamp with time zone DEFAULT current_timestamp
      );
    `);

    // Insert test data
    await client.query(`
      INSERT INTO hometest.test_type (test_code, description) VALUES
      ('HIV-TEST', 'HIV Rapid Test'),
      ('COVID-TEST', 'COVID-19 PCR Test');

      INSERT INTO hometest.status_type (status_code, description) VALUES
      ('GENERATED', 'Order has been generated'),
      ('QUEUED', 'Order has been queued'),
      ('PLACED', 'Order has been placed');

      INSERT INTO hometest.supplier (supplier_id, supplier_name, service_url, website_url, client_secret_name, client_id, oauth_token_path, order_path, oauth_scope) VALUES
      ('11111111-1111-1111-1111-111111111111', 'Test Supplier A', 'https://supplier-a.example.com', 'https://supplier-a.example.com', 'secret-a', 'client-a', '/oauth', '/order', 'orders'),
      ('22222222-2222-2222-2222-222222222222', 'Test Supplier B', 'https://supplier-b.example.com', 'https://supplier-b.example.com', 'secret-b', 'client-b', '/oauth', '/order', 'orders');

      INSERT INTO hometest.la_supplier_offering (supplier_id, test_code, la_code) VALUES
      ('11111111-1111-1111-1111-111111111111', 'HIV-TEST', 'LA001'),
      ('11111111-1111-1111-1111-111111111111', 'COVID-TEST', 'LA001'),
      ('22222222-2222-2222-2222-222222222222', 'HIV-TEST', 'LA002');
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
    // Clean up transaction-sensitive tables before each test
    await client.query("DELETE FROM hometest.order_status");
    await client.query("DELETE FROM hometest.test_order");
    await client.query("DELETE FROM hometest.patient_mapping");
  });

  describe("createPatientAndOrder - Transaction Atomicity", () => {
    it("should create patient, order, and order_status atomically", async () => {
      const result = await supplierService.createPatientAndOrder(
        "9999999999",
        "1990-01-01",
        "11111111-1111-1111-1111-111111111111",
        "HIV-TEST",
        "test-system",
      );

      expect(result.orderUid).toBeDefined();
      expect(result.orderReference).toBeGreaterThanOrEqual(100000);
      expect(result.patientUid).toBeDefined();

      // Verify patient was created
      const patientResult = await client.query(
        "SELECT * FROM hometest.patient_mapping WHERE patient_uid = $1",
        [result.patientUid],
      );
      expect(patientResult.rows).toHaveLength(1);
      expect(patientResult.rows[0].nhs_number).toBe("9999999999");

      // Verify order was created
      const orderResult = await client.query(
        "SELECT * FROM hometest.test_order WHERE order_uid = $1",
        [result.orderUid],
      );
      expect(orderResult.rows).toHaveLength(1);
      expect(orderResult.rows[0].patient_uid).toBe(result.patientUid);
      expect(orderResult.rows[0].test_code).toBe("HIV-TEST");

      // Verify order_status was created
      const statusResult = await client.query(
        "SELECT * FROM hometest.order_status WHERE order_uid = $1",
        [result.orderUid],
      );
      expect(statusResult.rows).toHaveLength(1);
      expect(statusResult.rows[0].status_code).toBe("GENERATED");
      expect(statusResult.rows[0].order_reference).toBe(result.orderReference);
    });

    it("should rollback all three inserts if order_status insert fails", async () => {
      // Delete the GENERATED status to force order_status insert to fail
      await client.query("DELETE FROM hometest.status_type WHERE status_code = 'GENERATED'");

      await expect(
        supplierService.createPatientAndOrder(
          "8888888888",
          "1985-05-15",
          "11111111-1111-1111-1111-111111111111",
          "HIV-TEST",
        ),
      ).rejects.toThrow();

      // Verify nothing was committed - no patient, order, or status
      const patientCount = await client.query(
        "SELECT COUNT(*) as count FROM hometest.patient_mapping WHERE nhs_number = $1",
        ["8888888888"],
      );
      expect(patientCount.rows[0].count).toBe("0");

      const orderCount = await client.query("SELECT COUNT(*) as count FROM hometest.test_order");
      expect(orderCount.rows[0].count).toBe("0");

      const statusCount = await client.query("SELECT COUNT(*) as count FROM hometest.order_status");
      expect(statusCount.rows[0].count).toBe("0");

      // Restore the status_type for other tests
      await client.query(
        "INSERT INTO hometest.status_type (status_code, description) VALUES ('GENERATED', 'Order has been generated')",
      );
    });

    it("should rollback all inserts if test_order insert fails due to invalid foreign key", async () => {
      await expect(
        supplierService.createPatientAndOrder(
          "7777777777",
          "1980-12-25",
          "99999999-9999-9999-9999-999999999999", // Non-existent supplier
          "HIV-TEST",
        ),
      ).rejects.toThrow();

      // Verify nothing was committed
      const patientCount = await client.query(
        "SELECT COUNT(*) as count FROM hometest.patient_mapping WHERE nhs_number = $1",
        ["7777777777"],
      );
      expect(patientCount.rows[0].count).toBe("0");
    });

    it("should reuse existing patient on conflict and still be atomic", async () => {
      // Create patient first
      const firstResult = await supplierService.createPatientAndOrder(
        "6666666666",
        "1975-03-10",
        "11111111-1111-1111-1111-111111111111",
        "HIV-TEST",
      );

      // Create second order for same patient
      const secondResult = await supplierService.createPatientAndOrder(
        "6666666666",
        "1975-03-10",
        "11111111-1111-1111-1111-111111111111",
        "COVID-TEST",
      );

      // Should reuse same patient
      expect(secondResult.patientUid).toBe(firstResult.patientUid);

      // Should have different orders
      expect(secondResult.orderUid).not.toBe(firstResult.orderUid);
      expect(secondResult.orderReference).not.toBe(firstResult.orderReference);

      // Verify we have 1 patient and 2 orders
      const patientCount = await client.query(
        "SELECT COUNT(*) as count FROM hometest.patient_mapping",
      );
      expect(patientCount.rows[0].count).toBe("1");

      const orderCount = await client.query("SELECT COUNT(*) as count FROM hometest.test_order");
      expect(orderCount.rows[0].count).toBe("2");

      const statusCount = await client.query("SELECT COUNT(*) as count FROM hometest.order_status");
      expect(statusCount.rows[0].count).toBe("2");
    });

    it("should generate sequential order_reference numbers", async () => {
      const order1 = await supplierService.createPatientAndOrder(
        "5555555555",
        "1990-01-01",
        "11111111-1111-1111-1111-111111111111",
        "HIV-TEST",
      );

      const order2 = await supplierService.createPatientAndOrder(
        "4444444444",
        "1991-02-02",
        "11111111-1111-1111-1111-111111111111",
        "COVID-TEST",
      );

      const order3 = await supplierService.createPatientAndOrder(
        "3333333333",
        "1992-03-03",
        "11111111-1111-1111-1111-111111111111",
        "HIV-TEST",
      );

      expect(order1.orderReference).toBeGreaterThanOrEqual(100000);
      expect(order2.orderReference).toBe(order1.orderReference + 1);
      expect(order3.orderReference).toBe(order2.orderReference + 1);
    });
  });

  describe("getSuppliersByLocalAuthorityAndTest - Complex Queries", () => {
    it("should return suppliers for specific LA and test code with JOINS", async () => {
      const result = await supplierService.getSuppliersByLocalAuthorityAndTest(
        "LA001",
        "HIV-TEST",
      );

      expect(result).toHaveLength(1);
      expect(result[0].organization.id).toBe("11111111-1111-1111-1111-111111111111");
      expect(result[0].organization.name).toBe("Test Supplier A");
    });

    it("should return multiple suppliers for LA when no test code specified", async () => {
      const result = await supplierService.getSuppliersByLocalAuthorityAndTest("LA001");

      expect(result).toHaveLength(2); // Supplier A has both tests for LA001
    });

    it("should return empty array when LA has no suppliers", async () => {
      const result = await supplierService.getSuppliersByLocalAuthorityAndTest("LA999");

      expect(result).toEqual([]);
    });

    it("should respect effective_from timestamp", async () => {
      // Add a future offering
      await client.query(`
        INSERT INTO hometest.la_supplier_offering (supplier_id, test_code, la_code, effective_from)
        VALUES ('22222222-2222-2222-2222-222222222222', 'COVID-TEST', 'LA003', NOW() + INTERVAL '1 day')
      `);

      const result = await supplierService.getSuppliersByLocalAuthorityAndTest("LA003", "COVID-TEST");
      expect(result).toHaveLength(0); // Future offering should not be returned
    });
  });

  describe("getSupplierConfigBySupplierId", () => {
    it("should return complete supplier config from database", async () => {
      const config = await supplierService.getSupplierConfigBySupplierId(
        "11111111-1111-1111-1111-111111111111",
      );

      expect(config).not.toBeNull();
      expect(config!.serviceUrl).toBe("https://supplier-a.example.com");
      expect(config!.clientSecretName).toBe("secret-a");
      expect(config!.clientId).toBe("client-a");
      expect(config!.oauthTokenPath).toBe("/oauth");
      expect(config!.orderPath).toBe("/order");
      expect(config!.oauthScope).toBe("orders");
    });

    it("should return null for non-existent supplier", async () => {
      const config = await supplierService.getSupplierConfigBySupplierId(
        "99999999-9999-9999-9999-999999999999",
      );

      expect(config).toBeNull();
    });
  });
});
