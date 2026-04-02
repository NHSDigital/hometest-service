import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import exec from "k6/execution";
import http from "k6/http";

import { closePatientLookupDb, getPatientIdByNhsAndBirthDate } from "./db/PatientLookupK6.js";
import { createOrderBody } from "./test-data/CreateOrder.js";
import { buildNormalResultObservation } from "./test-data/NormalResultObservation.js";

const orderUrl = "http://127.0.0.1:4566/_aws/execute-api/lwedds9nct/local/order";
const orderStatusUrl = "http://127.0.0.1:4566/_aws/execute-api/lwedds9nct/local/test-order/status";
const resultUrl = "http://127.0.0.1:4566/_aws/execute-api/lwedds9nct/local/result";
const baseHeaders = {
  "Content-Type": "application/json",
};

const fhirHeaders = {
  "Content-Type": "application/fhir+json",
};

function createRandomGuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function buildHeaders() {
  return {
    ...baseHeaders,
    "X-Correlation-ID": createRandomGuid(),
  };
}

function buildFhirHeaders() {
  return {
    ...fhirHeaders,
    "X-Correlation-ID": createRandomGuid(),
  };
}

function parseCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error("CSV file must contain a header and at least one data row");
  }

  const headersRow = lines[0].split(",").map((item) => item.trim());
  const requiredHeaders = ["supplierId", "birthDate", "nhsNumber"];

  for (const requiredHeader of requiredHeaders) {
    if (!headersRow.includes(requiredHeader)) {
      throw new Error(`CSV is missing required header: ${requiredHeader}`);
    }
  }

  return lines.slice(1).map((line, index) => {
    const values = line.split(",").map((item) => item.trim());
    const row = Object.fromEntries(headersRow.map((header, idx) => [header, values[idx] || ""]));

    for (const requiredHeader of requiredHeaders) {
      if (!row[requiredHeader]) {
        throw new Error(`CSV row ${index + 2} has an empty ${requiredHeader} value`);
      }
    }

    return row;
  });
}

const csvFilePath = __ENV.CREATE_ORDER_CSV || "./test-data/create-order-parameters.csv";

const createOrderParameters = new SharedArray("create-order-parameters", function () {
  return parseCsv(open(csvFilePath));
});

function getParametersForIteration() {
  const iteration = exec.scenario.iterationInTest;
  const row = createOrderParameters[iteration % createOrderParameters.length];

  return {
    supplierId: row.supplierId,
    birthDate: row.birthDate,
    nhsNumber: row.nhsNumber,
  };
}

function buildCreateOrderPayload(params) {
  return {
    ...createOrderBody,
    supplierId: params.supplierId,
    patient: {
      ...createOrderBody.patient,
      birthDate: params.birthDate,
      nhsNumber: params.nhsNumber,
    },
  };
}

function buildOrderStatusPayload(orderUid, patientUid, businessStatusText) {
  return {
    resourceType: "Task",
    status: "in-progress",
    intent: "order",
    identifier: [{ value: orderUid }],
    for: { reference: `Patient/${patientUid}` },
    businessStatus: { text: businessStatusText },
    lastModified: new Date().toISOString(),
  };
}

export const options = {
  scenarios: {
    createOrder: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 5 },
        { duration: "1m", target: 5 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "0s",
      exec: "createOrder",
    },
  },

  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"],
  },
};

export function createOrder() {
  const params = getParametersForIteration();
  const data = JSON.stringify(buildCreateOrderPayload(params));

  let res = http.request("POST", orderUrl, data, { headers: buildHeaders() });
  const orderId = res.json("orderUid");
  console.log(
    `Created order with ID: ${orderId} (Supplier: ${params.supplierId}, BirthDate: ${params.birthDate}, NHS Number: ${params.nhsNumber})`,
  );
  check(res, {
    "create order returns 201": (response) => response.status === 201,
  });

  const { patientId } = getPatientIdByNhsAndBirthDate(params.nhsNumber, params.birthDate);
  console.log(
    `Patient ID for NHS Number ${params.nhsNumber} and Birth Date ${params.birthDate}: ${patientId}`,
  );

  const dispatchedPayload = JSON.stringify(
    buildOrderStatusPayload(orderId, patientId, "dispatched"),
  );
  const dispatchedStatusRes = http.request("POST", orderStatusUrl, dispatchedPayload, {
    headers: buildHeaders(),
  });
  check(dispatchedStatusRes, {
    "order status dispatched returns 201": (response) => response.status === 201,
  });

  const receivedPayload = JSON.stringify(
    buildOrderStatusPayload(orderId, patientId, "received-at-lab"),
  );
  const receivedStatusRes = http.request("POST", orderStatusUrl, receivedPayload, {
    headers: buildHeaders(),
  });
  logStatusUpdateResponse("order status received", receivedStatusRes);
  check(receivedStatusRes, {
    "order status received returns 201": (response) => response.status === 201,
  });

  const normalResultPayload = JSON.stringify(
    buildNormalResultObservation(orderId, patientId, params.supplierId),
  );
  const normalResultRes = http.request("POST", resultUrl, normalResultPayload, {
    headers: buildFhirHeaders(),
  });
  logResultResponse(normalResultRes);
  check(normalResultRes, {
    "submit normal result returns 201": (response) => response.status === 201,
  });

  sleep(1);
}

export function teardown() {
  closePatientLookupDb();
}
