import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { OrderServiceRequestSchema } from "./order-service-request-schema";
import {
  OrderServiceRequest,
  OrderServiceTelecom,
} from "./order-service-request-type";
import {
  createJsonResponse,
  getCorrelationIdFromEventHeaders,
} from "../lib/utils";
import { init } from "./init";
import type {
  FHIRContactPoint,
  FHIRServiceRequest,
} from "../lib/models/fhir/fhir-service-request-type";
import type { ParsedOrderBody } from "../order-router-lambda";

const name = "order-service-lambda";
const { supplierService, sqsClient, orderPlacementQueueUrl } = init();

const mapTelecomToFhirContactPoints = (
  telecom: OrderServiceTelecom[],
): FHIRContactPoint[] => {
  const result: FHIRContactPoint[] = [];
  const mappings: Array<
    [keyof OrderServiceTelecom, FHIRContactPoint["system"]]
  > = [
    ["phone", "phone"],
    ["fax", "fax"],
    ["email", "email"],
    ["pager", "pager"],
    ["url", "url"],
    ["sms", "sms"],
    ["other", "other"],
  ];

  telecom.forEach((entry) => {
    mappings.forEach(([key, system]) => {
      const value = entry[key];
      if (value) {
        result.push({ system, value });
      }
    });
  });

  return result;
};

const buildFhirServiceRequest = (
  orderRequest: OrderServiceRequest,
  patientUid: string,
  orderUid: string,
): FHIRServiceRequest => {
  const { testCode, testDescription, supplierId, patient } = orderRequest;
  const { family, given, text, telecom, address, birthDate } = patient;
  const { use, type, line, city, postalCode, country } = address;

  return {
    resourceType: "ServiceRequest",
    id: orderUid,
    status: "active",
    intent: "order",
    code: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: testCode,
          display: testDescription,
        },
      ],
      text: testDescription,
    },
    contained: [
      {
        resourceType: "Patient",
        id: patientUid,
        name: [
          {
            use: "official",
            family,
            given,
            text,
          },
        ],
        telecom: mapTelecomToFhirContactPoints(telecom),
        address: [
          {
            use,
            type,
            line,
            city,
            postalCode,
            country,
          },
        ],
        birthDate,
      },
    ],
    subject: {
      reference: `#${patientUid}`,
    },
    requester: {
      reference: "HIV webapp",
    },
    performer: [
      {
        reference: `${supplierId}`,
      },
    ],
  };
};

const parseAndValidateRequest = (
  eventBody: string | null,
): OrderServiceRequest => {
  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(eventBody || "");
  } catch (error) {
    throw new Error("Invalid JSON in request body", { cause: error });
  }

  const validationResult = OrderServiceRequestSchema.safeParse(parsedBody);
  if (!validationResult.success) {
    let errorDetails = z.prettifyError(validationResult.error);
    errorDetails = errorDetails.replace(/(?:\u2716 |\r?\n )/g, "");
    throw new Error(`Validation failed: ${errorDetails}`);
  }

  return validationResult.data;
};

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  let correlationId: string;

  try {
    correlationId = getCorrelationIdFromEventHeaders(event);
  } catch (error) {
    console.error(name, "Failed to retrieve correlation ID", { error });
    return createJsonResponse(400, {
      message:
        error instanceof Error ? error.message : "Invalid correlation ID",
    });
  }

  console.info(name, "Received order request", {
    correlationId,
    path: event.path,
    method: event.httpMethod,
  });

  try {
    if (event.body === null || event.body === "{}") {
      return createJsonResponse(400, { message: "Empty body" });
    }

    const orderRequest = parseAndValidateRequest(event.body);

    console.info(name, "Order request validated", {
      correlationId,
      supplierId: orderRequest.supplierId,
      testCode: orderRequest.testCode,
    });

    // Create patient and order in database
    // ALPHA: no real idempotency check, but repeated requests should throw because of unique constraint on order_status.order_uid, which is generated as a UUID in createPatientAndOrderAndStatus
    const orderResult = await supplierService.createPatientAndOrderAndStatus(
      orderRequest.patient.nhsNumber,
      orderRequest.patient.birthDate,
      orderRequest.supplierId,
      orderRequest.testCode,
    );

    const orderBody = buildFhirServiceRequest(
      orderRequest,
      orderResult.patientUid,
      orderResult.orderUid,
    );

    const parsedOrderBody: ParsedOrderBody = {
      supplier_code: orderRequest.supplierId,
      correlation_id: correlationId,
      order_body: orderBody,
    };

    try {
      await sqsClient.sendMessage(
        orderPlacementQueueUrl,
        JSON.stringify(parsedOrderBody),
      );
    } catch (error) {
      console.error(name, "Failed to enqueue order", {
        correlationId,
        error,
      });
      return createJsonResponse(500, {
        message: "Failed to enqueue order",
      });
    }

    try {
      await supplierService.updateOrderStatus(
        orderResult.orderUid,
        orderResult.orderReference,
        "QUEUED",
      );
    } catch (error) {
      console.error(name, "Failed to update order status", {
        correlationId,
        error,
      });
      return createJsonResponse(500, {
        message: "Failed to update order status",
      });
    }

    console.info(name, "Order created successfully", {
      correlationId,
      orderUid: orderResult.orderUid,
      orderReference: orderResult.orderReference,
      patientUid: orderResult.patientUid,
    });

    return createJsonResponse(201, {
      orderUid: orderResult.orderUid,
      orderReference: orderResult.orderReference,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error(name, "Order request failed", { correlationId, error });
    return createJsonResponse(400, {
      message: error instanceof Error ? error.message : "Invalid request",
    });
  }
};
