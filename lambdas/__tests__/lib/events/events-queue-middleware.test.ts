import { Logger } from '@aws-lambda-powertools/logger';
import type middy from '@middy/core';
import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import { EventsQueueClientService } from '../../../src/lib/events/events-queue-client-service';
import { eventsQueueSourceMiddleware } from '../../../src/lib/events/events-queue-middleware';
import { type Request } from '@middy/core';

describe('eventsQueueSourceMiddleware tests', () => {
  const sandbox = Sinon.createSandbox();

  const sourceApp = 'nhs-app';

  let middlewareObj: middy.MiddlewareObj<any, any>;
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let logger: Sinon.SinonStubbedInstance<Logger>;
  let eventsQueueClientServiceMock: sinon.SinonStubbedInstance<EventsQueueClientService>;

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    (commonsStub as any).logger = null;
    logger = sandbox.createStubInstance(Logger);
    eventsQueueClientServiceMock = sandbox.createStubInstance(
      EventsQueueClientService
    );
    Sinon.stub(commonsStub, 'logger').value(logger);
    middlewareObj = eventsQueueSourceMiddleware(
      commonsStub as unknown as Commons,
      eventsQueueClientServiceMock
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  test('When app source exists it should be passed to the eventsQueueClientService', () => {
    const data = {
      event: {
        userData: {
          source: sourceApp
        }
      }
    } as unknown as Request<any, any>;

    middlewareObj.before?.(data);
    expect(eventsQueueClientServiceMock.source).toBe(sourceApp);
  });
});
