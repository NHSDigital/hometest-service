import { type Commons } from '../../../src/lib/commons';
import { healthCheckIdLogger } from '../../../src/lib/logging/health-check-logger-middleware';

describe('healthCheckIdLogger tests', () => {
  it('should log the health check ID', async () => {
    const appendKeys = jest.fn();
    const commons = { logger: { appendKeys } } as any;
    const middleware = healthCheckIdLogger(commons as Commons, 'id');
    const req = {
      event: {
        pathParameters: { id: '12345' }
      },
      context: {},
      response: undefined,
      error: undefined,
      internal: {}
    };
    if (middleware.before) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await middleware.before(req as any);
    }
    expect(appendKeys).toHaveBeenCalledWith({
      metadata: { healthCheckId: '12345' }
    });
  });

  it('should log the health check ID if in body', async () => {
    const appendKeys = jest.fn();
    const commons = { logger: { appendKeys } } as any;
    const middleware = healthCheckIdLogger(commons as Commons, 'id');
    const req = {
      event: {
        body: JSON.stringify({
          healthCheckId: 'beeboo'
        })
      },
      context: {},
      response: undefined,
      error: undefined,
      internal: {}
    };
    if (middleware.before) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await middleware.before(req as any);
    }
    expect(appendKeys).toHaveBeenCalledWith({
      metadata: { healthCheckId: 'beeboo' }
    });
  });
});
