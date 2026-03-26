import type { WireMockMapping } from "../../api/clients/WireMockClient";

interface SupplierOrderMappingOptions {
  correlationId?: string;
  priority?: number;
}

interface ServiceRequest {
  resourceType: "ServiceRequest";
  id: string;
  status: string;
  intent: string;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  contained?: unknown[];
  subject: {
    reference: string;
  };
  requester: {
    reference: string;
  };
  performer: Array<{
    reference: string;
  }>;
}

export function createSupplierOrderSuccessMapping(
  options: Partial<SupplierOrderMappingOptions> = {},
): WireMockMapping {
  return {
    priority: options.priority ?? 10,
    request: {
      method: "POST",
      urlPath: "/order",
      headers: {
        "Content-Type": {
          contains: "application/fhir+json",
        },
        "X-Correlation-ID": {
          ...(options.correlationId ? { equalTo: options.correlationId } : { matches: ".*" }),
        },
      },
    },
    response: {
      status: 201,
      headers: {
        "Content-Type": "application/fhir+json",
      },
      jsonBody: {
        resourceType: "ServiceRequest",
        id: "{{randomValue type='UUID'}}",
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
        contained: [
          {
            resourceType: "Patient",
            id: "patient-1",
            name: [
              {
                use: "official",
                family: "Doe",
                given: ["John"],
                text: "John Doe",
              },
            ],
            telecom: [
              {
                system: "phone",
                value: "+447700900000",
                use: "mobile",
              },
              {
                system: "email",
                value: "john.doe@example.com",
                use: "home",
              },
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
        ],
        subject: {
          reference: "#patient-1",
        },
        requester: {
          reference: "Organization/ORG001",
        },
        performer: [
          {
            reference: "Organization/SUP001",
          },
        ],
      },
      transformers: ["response-template"],
    },
  };
}

export function createSupplierOrderNotFoundMapping(
  nhsNumber?: string,
  dateOfBirth?: string,
  orderId?: string,
  options: Partial<SupplierOrderMappingOptions> = {},
): WireMockMapping {
  return {
    priority: options.priority ?? 10,
    request: {
      method: "GET",
      urlPath: "/order",
      queryParameters: {
        ...(nhsNumber && { nhs_number: { equalTo: nhsNumber } }),
        ...(dateOfBirth && { date_of_birth: { equalTo: dateOfBirth } }),
        ...(orderId && { order_id: { equalTo: orderId } }),
        ...(!nhsNumber &&
          !dateOfBirth &&
          !orderId && {
            nhs_number: { matches: "^(\\d{3}\\s?\\d{3}\\s?\\d{4})$" },
            date_of_birth: { matches: "^(19|20)\\d\\d-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$" },
            order_id: {
              matches:
                "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
            },
          }),
      },
    },
    response: {
      status: 404,
      headers: {
        "Content-Type": "application/fhir+json",
        "Access-Control-Allow-Origin": "*",
      },
      jsonBody: {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "not-found",
            details: {
              text: "Resource Not Found",
            },
            diagnostics: "The requested resource could not be found",
          },
        ],
      },
    },
  };
}

export function createSupplierOrderUnprocessableMapping(
  options: Partial<SupplierOrderMappingOptions> = {},
): WireMockMapping {
  return {
    priority: options.priority ?? 4,
    request: {
      method: "POST",
      urlPath: "/order",
      headers: {
        "Content-Type": {
          contains: "application/fhir+json",
        },
        "X-Correlation-ID": {
          ...(options.correlationId ? { equalTo: options.correlationId } : { matches: ".*" }),
        },
      },
      bodyPatterns: [
        {
          matchesJsonPath: {
            expression: "$.subject",
            absent: true,
          } as unknown,
        } as Record<string, unknown>,
      ],
    },
    response: {
      status: 422,
      headers: {
        "Content-Type": "application/fhir+json",
      },
      jsonBody: {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "structure",
            details: {
              text: "FHIR Validation Error",
            },
            diagnostics: "The FHIR resource contains validation errors and cannot be processed",
            expression: ["ServiceRequest.subject"],
          },
        ],
      },
    },
  };
}
