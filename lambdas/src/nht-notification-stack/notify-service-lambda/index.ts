import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
  type SQSEvent,
  type SQSRecord
} from 'aws-lambda';
import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { Commons } from '../../lib/commons';
import {
  LambdaEventType,
  sharedHandlerMiddleware
} from '../../lib/shared-handler-middleware';

const commons = new Commons('notification', 'notify-service');

const className = 'handler';

interface NotificationRequest {
  patientId: string;
  type: 'sms' | 'email' | 'push';
  templateId: string;
  templateData: Record<string, string>;
  recipient: {
    phoneNumber?: string;
    email?: string;
  };
}

interface NotificationMessage {
  notificationId: string;
  patientId: string;
  type: 'sms' | 'email' | 'push';
  templateId: string;
  templateData: Record<string, string>;
  recipient: {
    phoneNumber?: string;
    email?: string;
  };
}

/**
 * Notify Service Lambda
 * Sends notifications via NHS Notify (Gov.UK Notify)
 * Can be triggered via API Gateway or SQS
 */

// API Gateway handler for direct notification requests
const apiHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const request: NotificationRequest = JSON.parse(event.body);
    
    commons.logInfo(className, 'Sending notification', {
      patientId: request.patientId,
      type: request.type,
      templateId: request.templateId
    });

    // TODO: Validate notification request
    // TODO: Send notification via NHS Notify API
    // TODO: Log notification in DynamoDB

    const notificationId = `NOT-${Date.now()}`;

    return {
      statusCode: 202,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId,
        status: 'queued',
        message: 'Notification has been queued for delivery'
      })
    };
  } catch (error) {
    commons.logError(className, 'Error sending notification', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// SQS handler for processing notification queue
const sqsHandler = async (event: SQSEvent): Promise<{ batchItemFailures: { itemIdentifier: string }[] }> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  await Promise.allSettled(
    event.Records.map(async (record: SQSRecord) => {
      try {
        const notification: NotificationMessage = JSON.parse(record.body);
        
        commons.logInfo(className, 'Processing notification from queue', {
          notificationId: notification.notificationId,
          patientId: notification.patientId,
          type: notification.type
        });

        // TODO: Send notification via NHS Notify API
        // TODO: Update notification status in DynamoDB

        commons.logInfo(className, 'Notification sent successfully', {
          notificationId: notification.notificationId
        });
      } catch (error) {
        commons.logError(className, 'Error processing notification', {
          error,
          messageId: record.messageId
        });
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    })
  );

  return { batchItemFailures };
};

// Main handler that routes based on event type
const lambdaHandler = async (
  event: APIGatewayProxyEvent | SQSEvent
): Promise<APIGatewayProxyResult | { batchItemFailures: { itemIdentifier: string }[] }> => {
  // Check if this is an SQS event
  if ('Records' in event && event.Records?.[0]?.eventSource === 'aws:sqs') {
    return sqsHandler(event as SQSEvent);
  }
  
  // Otherwise treat as API Gateway event
  return apiHandler(event as APIGatewayProxyEvent);
};

export const handler = middy(lambdaHandler)
  .use(injectLambdaContext(commons.logger))
  .use(captureLambdaHandler(commons.tracer))
  .use(logMetrics(commons.metrics))
  .use(sharedHandlerMiddleware(LambdaEventType.API_GATEWAY));
