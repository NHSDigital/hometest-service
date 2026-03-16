import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { fhirResponse, jsonResponse } from "../utils/response";
import { v4 as uuidv4 } from "uuid";

/**
 * Mock Supplier Order endpoint.
 *
 * POST /mock/supplier/order → create order (FHIR ServiceRequest)
 * GET  /mock/supplier/order → get order status
 *
 * Supports X-Mock-Status header to force error scenarios:
 *   - "404" → order not found
 *   - "422" → unprocessable entity
 *   - "dispatched" / "confirmed" / "complete" → various order statuses
 */
export const handleOrder = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const mockStatus = event.headers?.["X-Mock-Status"] ?? event.headers?.["x-mock-status"];

  if (event.httpMethod === "POST") {
    return handleCreateOrder(event, mockStatus);
  }
  return handleGetOrder(event, mockStatus);
};

const handleCreateOrder = async (
  event: APIGatewayProxyEvent,
  mockStatus: string | undefined,
): Promise<APIGatewayProxyResult> => {
  if (mockStatus === "422") {
    return fhirResponse(422, {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "processing",
          details: { text: "Unprocessable Entity" },
          diagnostics: "The order could not be processed due to validation errors",
        },
      ],
    });
  }

  // Validate FHIR content type
  const contentType = event.headers?.["Content-Type"] ?? event.headers?.["content-type"] ?? "";
  if (!contentType.includes("application/fhir+json")) {
    return jsonResponse(415, {
      error: "Unsupported Media Type",
      message: "Content-Type must be application/fhir+json",
    });
  }

  // Parse request body to echo back patient details if present
  let requestBody: Record<string, unknown> = {};
  try {
    requestBody = JSON.parse(event.body ?? "{}");
  } catch {
    // use defaults
  }

  const orderId = uuidv4();
  const contained = (requestBody.contained as Record<string, unknown>[]) ?? [
    {
      resourceType: "Patient",
      id: "patient-1",
      name: [{ use: "official", family: "Doe", given: ["John"], text: "John Doe" }],
      telecom: [
        { system: "phone", value: "+447700900000", use: "mobile" },
        { system: "email", value: "john.doe@example.com", use: "home" },
      ],
      address: [
        {
          use: "home",
          type: "both",
          line: ["123 Main Street", "Flat 4B"],
          city: "London",
          postalCode: "SW1A 1AA",
          country: "United Kingdom",
        },
      ],
      birthDate: "1990-01-01",
    },
  ];

  return fhirResponse(201, {
    resourceType: "ServiceRequest",
    id: orderId,
    status: "active",
    intent: "order",
    code: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "31676001",
          display: "HIV antigen test",
        },
      ],
      text: "HIV antigen test",
    },
    contained,
    subject: { reference: "#patient-1" },
    requester: { reference: "Organization/ORG001" },
    performer: [{ reference: "Organization/SUP001", display: "Test Supplier Ltd" }],
  });
};

const handleGetOrder = async (
  event: APIGatewayProxyEvent,
  mockStatus: string | undefined,
): Promise<APIGatewayProxyResult> => {
  const orderId = event.queryStringParameters?.order_id ?? "018f6b6e-8b8e-7c2b-8f3b-8b8e7c2a8f3b";

  if (mockStatus === "404") {
    return fhirResponse(404, {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "not-found",
          details: { text: "Resource Not Found" },
          diagnostics: "The requested resource could not be found",
        },
      ],
    });
  }

  // Map mock status to FHIR task statuses
  const statusMap: Record<string, string> = {
    dispatched: "in-progress",
    confirmed: "accepted",
    complete: "completed",
  };
  const fhirStatus = statusMap[mockStatus ?? ""] ?? "active";

  return fhirResponse(200, {
    resourceType: "Bundle",
    type: "searchset",
    total: 1,
    entry: [
      {
        fullUrl: `urn:uuid:${orderId}`,
        resource: {
          resourceType: "ServiceRequest",
          id: orderId,
          identifier: [
            {
              system: "https://fhir.hometest.nhs.uk/Id/order-id",
              value: orderId,
            },
          ],
          status: fhirStatus,
          intent: "order",
          code: {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "31676001",
                display: "HIV antigen test",
              },
            ],
          },
          subject: { reference: "#patient-1" },
          performer: [{ reference: "Organization/SUP001", display: "Test Supplier Ltd" }],
        },
      },
    ],
  });
};
