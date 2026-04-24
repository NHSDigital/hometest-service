import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpSecurityHeaders from "@middy/http-security-headers";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ValidationError } from "src/lib/utils/validation-result";

import { OrderStatusUpdateParams } from "../lib/db/order-status-db";
import { createFhirErrorResponse, createFhirResponse } from "../lib/fhir-response";
import { securityHeaders } from "../lib/http/security-headers";
import { corsOptions } from "./cors-configuration";
import { init } from "./init";
import {
  isIncomingOrderStatus,
  isIncomingResultStatus,
  orderStatusMapping,
  resultStatusMapping,
} from "./models/mappings";
import { validateAndExtractCorrelationId } from "./validation/correlation-id-validation";
import { validatePatientOwnership } from "./validation/patient-validation";
import { validateAndExtractTask } from "./validation/task-validation";

const name = "order-status-lambda";

const fhirErrorFromValidation = (error: ValidationError): APIGatewayProxyResult =>
  createFhirErrorResponse(error.errorCode, error.errorType, error.errorMessage, error.severity);

/**
 * Lambda handler for POST /test-order/status endpoint
 * Adds a status record for a given order based on the incoming FHIR Task resource
 */
export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const {
    orderStatusDb,
    orderStatusReminderService,
    orderStatusNotifyService,
    insertResultStatusCommand,
  } = init();

  console.info(name, "Received order status update request", {
    path: event.path,
    method: event.httpMethod,
  });

  try {
    const correlationIdValidationResult = validateAndExtractCorrelationId(event);
    if (!correlationIdValidationResult.success) {
      return fhirErrorFromValidation(correlationIdValidationResult.error);
    }
    const correlationId = correlationIdValidationResult.data;

    const taskValidationResult = validateAndExtractTask(event.body);
    if (!taskValidationResult.success) {
      return fhirErrorFromValidation(taskValidationResult.error);
    }
    const task = taskValidationResult.data;
    const orderId = task.identifier[0].value;

    const orderPatientId = await orderStatusDb.getPatientIdFromOrder(orderId);
    if (!orderPatientId) {
      console.error(name, "Order not found", { orderId });

      return createFhirErrorResponse(
        404,
        "not-found",
        `Order with id ${orderId} not found`,
        "error",
      );
    }

    const patientOwnershipValidationResult = validatePatientOwnership(
      task.for.reference,
      orderPatientId,
      orderId,
    );

    if (!patientOwnershipValidationResult.success) {
      return fhirErrorFromValidation(patientOwnershipValidationResult.error);
    }

    const idempotencyCheck = await orderStatusDb.checkIdempotency(orderId, correlationId);
    if (idempotencyCheck.isDuplicate) {
      console.info(name, "Duplicate update detected via correlation ID", {
        orderId,
        correlationId,
      });

      return createFhirResponse(200, task);
    }

    const incomingStatus = task.businessStatus.text;

    if (isIncomingResultStatus(incomingStatus)) {
      const resultStatus = resultStatusMapping[incomingStatus];

      try {
        await insertResultStatusCommand.execute(orderId, resultStatus, correlationId);
      } catch (error) {
        console.warn(name, "Failed to update result status", {
          orderId,
          correlationId,
          resultStatus,
        });
      }

      console.info(name, "Result status update added successfully", {
        orderId,
        correlationId,
        resultStatus,
      });

      return createFhirResponse(201, task);
    }

    if (isIncomingOrderStatus(incomingStatus)) {
      const statusOrderUpdateParams: OrderStatusUpdateParams = {
        orderId,
        statusCode: orderStatusMapping[incomingStatus],
        createdAt: task.lastModified,
        correlationId,
      };

      await orderStatusDb.addOrderStatusUpdate(statusOrderUpdateParams);
      console.info(name, "Order status update added successfully", statusOrderUpdateParams);

      try {
        await orderStatusNotifyService.dispatch({
          orderId,
          patientId: orderPatientId,
          correlationId,
          statusCode: statusOrderUpdateParams.statusCode,
        });
      } catch (error) {
        console.error(name, "Failed to dispatch order status notification", {
          correlationId,
          orderId,
          error,
        });
      }

      await orderStatusReminderService.handleOrderStatusUpdated({
        orderId,
        correlationId,
        statusCode: statusOrderUpdateParams.statusCode,
        triggeredAt: statusOrderUpdateParams.createdAt,
      });

      return createFhirResponse(201, task);
    }

    return createFhirErrorResponse(400, "invalid", "Unrecognised business status", "error");
  } catch (error) {
    console.error(name, "Error processing order status update", {
      error,
    });
    return createFhirErrorResponse(500, "exception", "An internal error occurred", "fatal");
  }
};

export const handler = middy(lambdaHandler)
  .use(httpSecurityHeaders(securityHeaders))
  .use(cors(corsOptions))
  .use(httpErrorHandler());
