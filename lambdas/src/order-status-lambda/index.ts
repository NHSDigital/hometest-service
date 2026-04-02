import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import z from "zod";

import { ConsoleCommons } from "../lib/commons";
import { NotificationAuditStatus } from "../lib/db/notification-audit-db-client";
import { OrderStatusCodes, OrderStatusUpdateParams } from "../lib/db/order-status-db";
import { createFhirErrorResponse, createFhirResponse } from "../lib/fhir-response";
import { securityHeaders } from "../lib/http/security-headers";
import {
  FHIRCodeableConceptSchema,
  FHIRIdentifierSchema,
  FHIRReferenceSchema,
  FHIRTaskSchema,
} from "../lib/models/fhir/fhir-schemas";
import { getCorrelationIdFromEventHeaders } from "../lib/utils/utils";
import { corsOptions } from "./cors-configuration";
import { init } from "./init";
import { IncomingBusinessStatus } from "./types";
import { businessStatusMapping, extractIdFromReference } from "./utils";

const commons = new ConsoleCommons();
const name = "order-status-lambda";

const orderStatusFHIRTaskSchema = FHIRTaskSchema.extend({
  identifier: z.array(FHIRIdentifierSchema).min(1).max(1),
  for: FHIRReferenceSchema,
  lastModified: z.iso.datetime(),
  businessStatus: FHIRCodeableConceptSchema.extend({
    text: z.enum(IncomingBusinessStatus),
  }),
});

export type OrderStatusFHIRTask = z.infer<typeof orderStatusFHIRTaskSchema>;

/**
 * Lambda handler for POST /test-order/status endpoint
 * Adds a status record for a given order based on the incoming FHIR Task resource
 */
export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const {
    orderStatusDb,
    notificationAuditDbClient,
    sqsClient,
    notifyMessageBuilder,
    notifyMessagesQueueUrl,
  } = init();
  commons.logInfo(name, "Received order status update request", {
    path: event.path,
    method: event.httpMethod,
  });

  let task: unknown;

  if (!event.body) {
    commons.logError(name, "Missing request body");

    return createFhirErrorResponse(400, "invalid", "Request body is required", "error");
  }

  try {
    task = JSON.parse(event.body);
  } catch (error) {
    commons.logError(name, "Invalid JSON in request body", { error });

    return createFhirErrorResponse(400, "invalid", "Invalid JSON in request body", "error");
  }

  const validationResult = orderStatusFHIRTaskSchema.safeParse(task);

  if (!validationResult.success) {
    const errorDetails = validationResult.error.issues
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join("; ");

    commons.logError(name, "Task validation failed", {
      error: errorDetails,
    });

    return createFhirErrorResponse(400, "invalid", errorDetails, "error");
  }

  const validatedTask = validationResult.data;
  const orderId = validatedTask.identifier[0].value;

  try {
    let correlationId: string;

    try {
      correlationId = getCorrelationIdFromEventHeaders(event);
    } catch (error) {
      commons.logError(name, "Failed to retrieve correlation ID", { error });

      return createFhirErrorResponse(
        400,
        "invalid",
        error instanceof Error ? error.message : "Invalid correlation ID",
        "error",
      );
    }

    // Verify order exists and retrieve associated patient ID
    const orderPatientId = await orderStatusDb.getPatientIdFromOrder(orderId);

    if (!orderPatientId) {
      commons.logError(name, "Order not found", { orderId });

      return createFhirErrorResponse(
        404,
        "not-found",
        `Order with id ${orderId} not found`,
        "error",
      );
    }

    // Verify patient ownership
    const patientIdFromTask = extractIdFromReference(validatedTask.for.reference);

    if (!patientIdFromTask) {
      commons.logError(name, "Invalid patient reference format", {
        reference: validatedTask.for.reference,
      });

      return createFhirErrorResponse(400, "invalid", "Invalid patient reference format", "error");
    }

    if (patientIdFromTask !== orderPatientId) {
      commons.logError(name, "Patient mismatch for order", {
        orderId,
        expectedPatient: orderPatientId,
        providedPatient: patientIdFromTask,
      });

      return createFhirErrorResponse(
        400,
        "invalid",
        "Patient ID does not match the order",
        "error",
      );
    }

    // Check for idempotency via Correlation ID
    const idempotencyCheck = await orderStatusDb.checkIdempotency(orderId, correlationId);

    if (idempotencyCheck.isDuplicate) {
      commons.logInfo(name, "Duplicate update detected via correlation ID", {
        orderId,
        correlationId,
      });

      return createFhirResponse(200, validatedTask);
    }

    // Process the update
    const statusOrderUpdateParams: OrderStatusUpdateParams = {
      orderId,
      statusCode: businessStatusMapping[validatedTask.businessStatus.text],
      createdAt: validatedTask.lastModified,
      correlationId,
    };

    await orderStatusDb.addOrderStatusUpdate(statusOrderUpdateParams);

    commons.logInfo(name, "Order status update added successfully", statusOrderUpdateParams);

    if (statusOrderUpdateParams.statusCode === OrderStatusCodes.DISPATCHED) {
      const isFirstDispatched = await orderStatusDb.isFirstStatusOccurrence(
        orderId,
        OrderStatusCodes.DISPATCHED,
      );

      if (isFirstDispatched) {
        const notifyMessage = await notifyMessageBuilder.buildOrderDispatchedNotifyMessage({
          patientId: orderPatientId,
          correlationId,
          orderId,
          dispatchedAt: statusOrderUpdateParams.createdAt,
        });

        await sqsClient.sendMessage(notifyMessagesQueueUrl, JSON.stringify(notifyMessage));

        await notificationAuditDbClient.insertNotificationAuditEntry({
          messageReference: notifyMessage.messageReference,
          eventCode: notifyMessage.eventCode,
          correlationId,
          status: NotificationAuditStatus.SENT,
        });
      }
    }

    return createFhirResponse(201, validatedTask);
  } catch (error) {
    commons.logError(name, "Error processing order status update", {
      error,
    });
    return createFhirErrorResponse(500, "exception", "An internal error occurred", "fatal");
  }
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(corsOptions))
  .use(httpErrorHandler());
