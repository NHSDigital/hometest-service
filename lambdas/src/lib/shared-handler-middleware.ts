/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type SQSEvent,
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult
} from 'aws-lambda';
import type middy from '@middy/core';
import { type Commons } from './commons';
import { v4 as uuidv4 } from 'uuid';
import { utils } from 'aws-xray-sdk';
import type { EventBridge } from 'aws-sdk';

export enum LambdaEventType {
  APIGatewayProxyEvent = 'APIGatewayProxyEvent',
  LambdaEvent = 'LambdaEvent',
  SQSEvent = 'SQSEvent',
  EventBridgeEvent = 'EventBridgeEvent'
}

const className = 'sharedHandlerMiddleware';

const sharedHandlerMiddleware = (
  commons: Commons,
  eventType: LambdaEventType
): middy.MiddlewareObj<any, any> => {
  const commonInitialization = (
    commons: Commons,
    correlationId: string | string[]
  ): void => {
    commons.correlationId = correlationId;
    commons.logger.appendKeys({
      metadata: {
        correlationId
      }
    });
  };

  const beforeLambdaEvent: middy.MiddlewareFn<any, any> = async (
    data
  ): Promise<void> => {
    commons.logDebug(className, 'lambda event middleware processing');
    const correlationId: string =
      data.event.correlationId === undefined
        ? uuidv4()
        : data.event.correlationId;

    commonInitialization(commons, correlationId);
  };

  const beforeApiGatewayEvent: middy.MiddlewareFn<
    APIGatewayProxyEvent,
    APIGatewayProxyResult
  > = async (): Promise<void> => {
    commons.logDebug(className, 'api gateway event middleware processing');

    const correlationId = uuidv4();
    commonInitialization(commons, correlationId);
  };

  const beforeEventBridgeEvent: middy.MiddlewareFn<
    EventBridge,
    any
  > = async (): Promise<void> => {
    commons.logDebug(className, 'event bridge middleware processing');

    const correlationId = uuidv4();
    commonInitialization(commons, correlationId);
  };

  const beforeSqsEvent: middy.MiddlewareFn<SQSEvent, any> = async (
    data
  ): Promise<void> => {
    const correlationIds: string[] = [];
    const traceIds: string[] = [];

    for (const record of data.event.Records) {
      const correlationId: string =
        JSON.parse(record.body).correlationId ?? uuidv4();
      correlationIds.push(correlationId);

      const traceHeaderStr = record.attributes?.AWSTraceHeader;
      const traceData = utils.processTraceData(traceHeaderStr);
      const traceId = traceData?.root;
      if (traceId !== undefined) {
        traceIds.push(traceId);
      }
    }

    commonInitialization(commons, correlationIds);
    commons.logger.appendKeys({
      metadata: {
        xRayTraceId: traceIds
      }
    });
    commons.logDebug(className, 'SQS event middleware processing');
  };

  let before: middy.MiddlewareFn<any, any>;
  switch (eventType) {
    case LambdaEventType.APIGatewayProxyEvent:
      before = beforeApiGatewayEvent;
      break;
    case LambdaEventType.SQSEvent:
      before = beforeSqsEvent;
      break;
    case LambdaEventType.EventBridgeEvent:
      before = beforeEventBridgeEvent;
      break;
    case LambdaEventType.LambdaEvent:
    default:
      before = beforeLambdaEvent;
      break;
  }

  return {
    before
  };
};

export { sharedHandlerMiddleware };
