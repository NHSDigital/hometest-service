import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import exec from "k6/execution";
import http from "k6/http";

import { postCreateOrder } from "./api/createOrder.js";
import { postResult } from "./api/updateResults.js";
import { postOrderStatusUpdate } from "./api/updateStatus.js";
import { ORDER_STATUS_URL, ORDER_URL, RESULT_URL } from "./configuration/endpoints.js";
import { closePatientLookupDb, getPatientIdByNhsAndBirthDate } from "./db/PatientLookupK6.js";
import { buildFhirHeaders, buildHeaders, parseCsv } from "./helpers/k6-request-utils.js";
import { buildCreateOrderPayload } from "./test-data/CreateOrder.js";
import { buildNormalResultObservation } from "./test-data/NormalResultObservation.js";
import { buildOrderStatusPayload } from "./test-data/OrderStatusTask.js";

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

export const options = {
  scenarios: {
    createOrder: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 2 },
        { duration: "1m", target: 5 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "0s",
      exec: "endToEnd",
    },
  },

  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"],
  },
};

export function endToEnd() {
  //Create order
  const params = getParametersForIteration();
  const data = JSON.stringify(buildCreateOrderPayload(params));

  let res = postCreateOrder(data, buildHeaders());
  const orderId = res.json("orderUid");
  console.log(
    `Created order with ID: ${orderId} (Supplier: ${params.supplierId}, BirthDate: ${params.birthDate}, NHS Number: ${params.nhsNumber})`,
  );
  check(res, {
    "create order returns 201": (response) => response.status === 201,
  });
  sleep(1);

  const { patientId } = getPatientIdByNhsAndBirthDate(params.nhsNumber, params.birthDate);

  //Update order status to dispatched
  const dispatchedPayload = JSON.stringify(
    buildOrderStatusPayload(orderId, patientId, "dispatched"),
  );
  const dispatchedStatusRes = postOrderStatusUpdate(dispatchedPayload, buildHeaders());
  check(dispatchedStatusRes, {
    "order status dispatched returns 201": (response) => response.status === 201,
  });
  sleep(1);

  //Update order status to received-at-lab
  const receivedPayload = JSON.stringify(
    buildOrderStatusPayload(orderId, patientId, "received-at-lab"),
  );
  const receivedStatusRes = postOrderStatusUpdate(receivedPayload, buildHeaders());
  check(receivedStatusRes, {
    "order status received returns 201": (response) => response.status === 201,
  });
  sleep(1);

  //Update results
  const normalResultPayload = JSON.stringify(
    buildNormalResultObservation(orderId, patientId, params.supplierId),
  );
  const normalResultRes = postResult(normalResultPayload, buildFhirHeaders());
  check(normalResultRes, {
    "submit normal result returns 201": (response) => response.status === 201,
  });

  sleep(1);
}

export function teardown() {
  closePatientLookupDb();
}
