import type middy from '@middy/core';
import { type Commons } from '../commons';
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult
} from 'aws-lambda';

const healthCheckIdLogger = (
  commons: Commons,
  pathParameter = 'id'
): middy.MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> => {
  return {
    before: (request) => {
      const healthCheckId =
        request.event.pathParameters?.[pathParameter] ||
        JSON.parse(request.event.body ?? '{}')?.healthCheckId;

      if (healthCheckId) {
        commons.logger.appendKeys({ metadata: { healthCheckId } });
      }
    }
  };
};

export { healthCheckIdLogger };
