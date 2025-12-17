/* eslint-disable no-duplicate-imports */
import { type Commons } from '../../src/lib/commons';
import Sinon from 'ts-sinon';
import {
  LambdaEventType,
  sharedHandlerMiddleware
} from '../../src/lib/shared-handler-middleware';
import type middy from '@middy/core';
import { type Request } from '@middy/core';
import { utils } from 'aws-xray-sdk';

const uuid = '123456789';
jest.mock('uuid', () => ({ v4: () => uuid }));
jest.mock('aws-xray-sdk', () => ({
  utils: {
    processTraceData: jest.fn()
  }
}));

describe('sharedHandlerMiddleware', () => {
  const correlationId = 'abcd12345678';
  const correlationId2 = 'efgh12345678';
  const resourcePath = '/some/path';
  const traceData = {
    root: '1-5759e988-bd862e3fe1be46a994272793',
    parent: '53995c3f42cd8ad8'
  };
  const appendKeysStub = Sinon.stub();
  const logStub = Sinon.stub();
  const debugStub = Sinon.stub();
  const commonsStub = {
    logger: {
      appendKeys: appendKeysStub
    },
    logInfo: logStub,
    logDebug: debugStub,
    correlationId: ''
  } as unknown as Commons;
  const processTraceDataSpy = jest.spyOn(utils, 'processTraceData');

  beforeEach(() => {
    processTraceDataSpy.mockReturnValue(traceData);
  });

  afterEach(() => {
    appendKeysStub.reset();
    logStub.reset();
    debugStub.reset();
    processTraceDataSpy.mockReset();
  });

  describe.each([
    ['APIGatewayProxyEvent', LambdaEventType.APIGatewayProxyEvent],
    ['LambdaEvent', LambdaEventType.LambdaEvent],
    ['EventBridgeEvent', LambdaEventType.EventBridgeEvent]
  ])('before%s', (_name, eventType) => {
    const handlerMiddleware: middy.MiddlewareObj<any, any> =
      sharedHandlerMiddleware(commonsStub as unknown as Commons, eventType);

    test('should generate new correlationId', async () => {
      const request = {
        event: {
          requestContext: {
            resourcePath
          }
        }
      } as unknown as Request<any, any>;

      if (handlerMiddleware.before !== undefined) {
        await handlerMiddleware.before(request);
      }

      Sinon.assert.match(commonsStub.correlationId, uuid);
      Sinon.assert.calledWith(appendKeysStub, {
        metadata: {
          correlationId: uuid
        }
      });
    });
  });

  describe('beforeSqsEvent', () => {
    const handlerMiddleware: middy.MiddlewareObj<any, any> =
      sharedHandlerMiddleware(
        commonsStub as unknown as Commons,
        LambdaEventType.SQSEvent
      );

    test('should set correlationIds retrieved from data.event.Records', async () => {
      const data = {
        event: {
          Records: [
            {
              body: JSON.stringify({
                correlationId
              }),
              attributes: {
                AWSTraceHeader: 'header'
              }
            },
            {
              body: JSON.stringify({
                correlationId: correlationId2
              })
            }
          ]
        }
      } as unknown as Request<any, any>;

      if (handlerMiddleware.before !== undefined) {
        await handlerMiddleware.before(data);
      }

      Sinon.assert.match(commonsStub.correlationId, [
        correlationId,
        correlationId2
      ]);
      Sinon.assert.calledTwice(appendKeysStub);
      Sinon.assert.calledWith(appendKeysStub.firstCall, {
        metadata: {
          correlationId: [correlationId, correlationId2]
        }
      });
      Sinon.assert.calledWith(appendKeysStub.secondCall, {
        metadata: {
          xRayTraceId: [traceData.root, traceData.root]
        }
      });
    });

    test('should generate new correlationId when correlationId is not present in data.event.Records body', async () => {
      const data = {
        event: {
          Records: [
            {
              body: JSON.stringify({}),
              attributes: {
                AWSTraceHeader: 'header'
              }
            }
          ]
        }
      } as unknown as Request<any, any>;

      if (handlerMiddleware.before !== undefined) {
        await handlerMiddleware.before(data);
      }

      Sinon.assert.match(commonsStub.correlationId, [uuid]);
      Sinon.assert.calledTwice(appendKeysStub);
      Sinon.assert.calledWith(appendKeysStub.firstCall, {
        metadata: {
          correlationId: [uuid]
        }
      });
      Sinon.assert.calledWith(appendKeysStub.secondCall, {
        metadata: {
          xRayTraceId: [traceData.root]
        }
      });
    });
  });
});
