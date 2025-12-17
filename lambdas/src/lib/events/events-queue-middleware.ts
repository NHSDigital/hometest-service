import type middy from '@middy/core';
import { type EventsQueueClientService } from './events-queue-client-service';
import { type Commons } from '../commons';

const className = 'eventsQueueSourceMiddleware';

const eventsQueueSourceMiddleware = (
  commons: Commons,
  eventsQueueClientService: EventsQueueClientService
): middy.MiddlewareObj<any, any> => {
  const before: middy.MiddlewareFn<any, any> = async (
    request
  ): Promise<void> => {
    commons.logDebug(className, 'events queue source middleware processing');
    if (request.event.userData !== undefined) {
      eventsQueueClientService.source = request.event.userData.source;
    }
  };
  return { before };
};

export { eventsQueueSourceMiddleware };
