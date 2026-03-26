import type { WireMockMapping } from "../../api/clients/WireMockClient";
import { ResultsObservationData, type HIVObservation } from "../../test-data/ResultsObservationData";

interface SupplierResultMappingOptions {
  orderId: string;
  correlationId?: string;
  priority?: number;
}

interface Bundle<T> {
  resourceType: "Bundle";
  type: string;
  entry?: Array<{ resource: T }>;
}

interface OperationOutcome {
  resourceType: "OperationOutcome";
  issue: Array<{
    severity: string;
    code: string;
    details: {
      text: string;
    };
    diagnostics?: string;
  }>;
}


export function createSupplierResultSuccessMapping(
  orderId: string,
  patientId: string,
  supplierId: string,
  options: Partial<SupplierResultMappingOptions> = {},
): WireMockMapping {
  const observation = ResultsObservationData.buildNormalObservation(orderId, patientId, supplierId);
  const bundle: Bundle<HIVObservation> = {
    resourceType: "Bundle",
    type: "searchset",
    entry: [
      {
        resource: observation,
      },
    ],
  };

  return {
    priority: options.priority ?? 1,
    request: {
      method: "GET",
      urlPathPattern: "/(results|api/results|nhs_home_test/results)",
      queryParameters: {
        order_uid: { equalTo: orderId },
      },
      headers: {
        "X-Correlation-ID": {
          ...(options.correlationId
            ? { equalTo: options.correlationId }
            : { matches: ".*" }),
        },
      },
    },
    response: {
      status: 200,
      headers: {
        "Content-Type": "application/fhir+json",
      },
      jsonBody: bundle,
    },
  };
}


export function createSupplierResultNotFoundMapping(
  orderId: string,
  options: Partial<SupplierResultMappingOptions> = {},
): WireMockMapping {
  const operationOutcome: OperationOutcome = {
    resourceType: "OperationOutcome",
    issue: [
      {
        severity: "error",
        code: "not-found",
        details: {
          text: "Results Not Found",
        },
        diagnostics: "No test results were found for the specified order",
      },
    ],
  };

  return {
    priority: options.priority ?? 1,
    request: {
      method: "GET",
      urlPathPattern: "/(results|api/results|nhs_home_test/results)",
      queryParameters: {
        order_uid: { equalTo: orderId },
      },
      headers: {
        "X-Correlation-ID": {
          ...(options.correlationId
            ? { equalTo: options.correlationId }
            : { matches: ".*" }),
        },
      },
    },
    response: {
      status: 404,
      headers: {
        "Content-Type": "application/fhir+json",
      },
      jsonBody: operationOutcome,
    },
  };
}


export function createSupplierResultServerErrorMapping(
  orderId: string,
  options: Partial<SupplierResultMappingOptions> = {},
): WireMockMapping {
  const operationOutcome: OperationOutcome = {
    resourceType: "OperationOutcome",
    issue: [
      {
        severity: "error",
        code: "exception",
        details: {
          text: "Internal Server Error",
        },
        diagnostics: "An unexpected error occurred while processing the request",
      },
    ],
  };

  return {
    priority: options.priority ?? 1,
    request: {
      method: "GET",
      urlPathPattern: "/(results|api/results|nhs_home_test/results)",
      queryParameters: {
        order_uid: { equalTo: orderId },
      },
      headers: {
        "X-Correlation-ID": {
          ...(options.correlationId
            ? { equalTo: options.correlationId }
            : { matches: ".*" }),
        },
      },
    },
    response: {
      status: 500,
      headers: {
        "Content-Type": "application/fhir+json",
      },
      jsonBody: operationOutcome,
    },
  };
}


export function createSupplierResultAbnormalMapping(
  orderId: string,
  patientId: string,
  supplierId: string,
  options: Partial<SupplierResultMappingOptions> = {},
): WireMockMapping {
  const observation = ResultsObservationData.buildAbnormalObservation(orderId, patientId, supplierId);
  const bundle: Bundle<HIVObservation> = {
    resourceType: "Bundle",
    type: "searchset",
    entry: [
      {
        resource: observation,
      },
    ],
  };

  return {
    priority: options.priority ?? 1,
    request: {
      method: "GET",
      urlPathPattern: "/(results|api/results|nhs_home_test/results)",
      queryParameters: {
        order_uid: { equalTo: orderId },
      },
      headers: {
        "X-Correlation-ID": {
          ...(options.correlationId
            ? { equalTo: options.correlationId }
            : { matches: ".*" }),
        },
      },
    },
    response: {
      status: 200,
      headers: {
        "Content-Type": "application/fhir+json",
      },
      jsonBody: bundle,
    },
  };
}
