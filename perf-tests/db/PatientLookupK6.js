import sql from "k6/x/sql";
import driver from "k6/x/sql/driver/postgres";

const dbHost = __ENV.DB_HOST || "localhost";
const dbPort = __ENV.DB_PORT || "5432";
const dbName = __ENV.DB_NAME || "local_hometest_db";
const dbUser = __ENV.DB_USER || "admin";
const dbPassword = __ENV.DB_PASSWORD || "admin";
const dbSchema = __ENV.DB_SCHEMA || "hometest";

const dbConnectionString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?sslmode=disable&search_path=${dbSchema}`;

const db = sql.open(driver, dbConnectionString);

export function getPatientIdByOrderId(orderId) {
  const rows = db.query(
    `SELECT patient_uid::text
     FROM test_order
     WHERE order_uid = $1::uuid
     LIMIT 1`,
    orderId,
  );

  return {
    patientId: rows[0]?.patient_uid,
  };
}

export function closePatientLookupDb() {
  db.close();
}
