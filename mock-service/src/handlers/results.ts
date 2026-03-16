import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { fhirResponse } from "../utils/response";
import { v4 as uuidv4 } from "uuid";

/**
 * Mock Supplier Results endpoint.
 *
 * GET /mock/supplier/results?order_uid=<uuid>
 *
 * Returns a FHIR Bundle with an Observation resource.
 *
 * Supports X-Mock-Status header:
 *   - "404" → results not found
 *   - "400" → invalid request
 */
export const handleResults = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const mockStatus = event.headers?.["X-Mock-Status"] ?? event.headers?.["x-mock-status"];
  const correlationId = event.headers?.["X-Correlation-ID"] ?? event.headers?.["x-correlation-id"];
  const orderUid = event.queryStringParameters?.order_uid;

  if (mockStatus === "400") {
    return fhirResponse(400, {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "invalid",
          details: { text: "Invalid Request" },
          diagnostics: "The request was invalid — order_uid is required",
        },
      ],
    });
  }

  if (mockStatus === "404" || !orderUid) {
    return fhirResponse(404, {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "not-found",
          details: { text: "Results Not Found" },
          diagnostics: "No test results were found for the specified order",
        },
      ],
    });
  }

  const observationId = uuidv4();
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  return fhirResponse(200, {
    resourceType: "Bundle",
    type: "searchset",
    total: 1,
    link: [
      {
        relation: "self",
        url: `/results?order_uid=${orderUid}`,
      },
    ],
    entry: [
      {
        fullUrl: `urn:uuid:${observationId}`,
        resource: {
          resourceType: "Observation",
          id: observationId,
          meta: {
            ...(correlationId ? { tag: [{ code: correlationId }] } : {}),
          },
          basedOn: [{ reference: `ServiceRequest/${orderUid}` }],
          status: "final",
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
          subject: { reference: "Patient/123e4567-e89b-12d3-a456-426614174000" },
          effectiveDateTime: `${twoDaysAgo.toISOString().split("T")[0]}T15:45:00Z`,
          issued: `${oneDayAgo.toISOString().split("T")[0]}T16:00:00Z`,
          performer: [
            { reference: "Organization/SUP001", display: "Test Supplier Ltd" },
          ],
          valueCodeableConcept: {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: "260415000",
                display: "Not detected",
              },
            ],
          },
          interpretation: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                  code: "N",
                  display: "Normal",
                },
              ],
            },
          ],
        },
      },
    ],
  });
};
