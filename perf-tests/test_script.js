import http from "k6/http";
import { check, sleep } from "k6";
export const options = {
  scenarios: {
    getResults: {
      executor: 'constant-vus',
      vus: 1,
      duration: '3s',
      exec: 'getResults',
    },
    createOrder: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 21 },
        { duration: "1m", target: 21 },
        { duration: "30s", target: 0 },
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

export function getResults() {
  const res = http.get(
    "http://127.0.0.1:4566/_aws/execute-api/em6tgcf0fu/local/results?nhs_number=9658219012&date_of_birth=1975-01-01&order_id=b83c0494-80bb-4db7-9426-d87c148f92b2",
    { headers: { "X-Correlation-ID": "490e4ade-238c-4518-980a-16a621988cbb" } },
  );
  check(res, {
    "status was 200": (r) => r.status === 200,
  });
  sleep(1);
}

const url = "http://127.0.0.1:4566/_aws/execute-api/em6tgcf0fu/local/order";

export function createOrder() {
  const headers = {
    "X-Correlation-ID": "590e4ade-238c-4518-980a-16a621988cbb",
    "Content-Type": "application/json",
  };
  const data = JSON.stringify({
    testCode: "31676001",
    testDescription: "HIV antigen test",
    supplierId: "c1a2b3c4-1234-4def-8abc-123456789abc",
    patient: {
      family: "IntegrationTest",
      given: ["Automated"],
      text: "Automated IntegrationTest",
      telecom: [
        {
          phone: "+447700900999",
        },
        {
          email: "automated.integration@example.com",
        },
      ],
      address: {
        line: ["1 Integration Street"],
        city: "London",
        postalCode: "SW1A 1AA",
        country: "United Kingdom",
        use: "home",
        type: "both",
      },
      birthDate: "1990-06-15",
      nhsNumber: "9000000001",
    },
    consent: true,
  });

  let res = http.request("POST", url, data, { headers: headers });
  console.log(res.json());
  sleep(1);
}
