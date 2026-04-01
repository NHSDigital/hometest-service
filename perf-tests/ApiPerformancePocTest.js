import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import exec from "k6/execution";
import http from "k6/http";

import { createOrderBody } from "./test-data/CreateOrder.js";

const url = "http://127.0.0.1:4566/_aws/execute-api/5vxedyq1of/local/order";
const headers = {
  "X-Correlation-ID": "590e4ade-238c-4518-980a-16a621988cbb",
  "Content-Type": "application/json",
};

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

export const options = {
  scenarios: {
    createOrder: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 5 },
        // { duration: "1m", target: 5 },
        // { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "0s",
      exec: "createOrder",
    },
  },

  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<200"],
  },
};

export function createOrder() {
  const params = getParametersForIteration();
  const data = JSON.stringify(buildCreateOrderPayload(params));

  let res = http.request("POST", url, data, { headers: headers });
  const orderId = res.json("orderUid");
  console.log(
    `Created order with ID: ${orderId} (Supplier: ${params.supplierId}, BirthDate: ${params.birthDate}, NHS Number: ${params.nhsNumber})`,
  );
  check(res, {
    "create order returns 201": (response) => response.status === 201,
  });
  sleep(1);
}
