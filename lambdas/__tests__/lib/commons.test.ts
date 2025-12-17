import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import sinon from 'sinon';
import { Commons } from '../../src/lib/commons';

describe('Commons', () => {
  let commons: Commons;
  const stackName = 'testStack';
  const lambdaName = 'testLambda';
  const module = 'testModule';
  const msg = 'test message';
  let loggerDebugSpy: sinon.SinonSpy;
  let loggerErrorSpy: sinon.SinonSpy;
  let loggerInfoSpy: sinon.SinonSpy;

  beforeEach(() => {
    commons = new Commons(stackName, lambdaName);
  });

  it('should initialize with correct values', () => {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    expect(commons['stackName']).toBe(stackName);
    // eslint-disable-next-line @typescript-eslint/dot-notation
    expect(commons['lambdaName']).toBe(lambdaName);
    expect(commons.metrics).toBeInstanceOf(Metrics);
    expect(commons.logger).toBeInstanceOf(Logger);
  });

  it('should set up tracing correctly', () => {
    const awsClientS3 = {};
    const captureAWSv3ClientSpy = sinon.spy(
      Tracer.prototype,
      'captureAWSv3Client'
    );

    commons.setUpTracing(awsClientS3);

    expect(commons.tracer).toBeInstanceOf(Tracer);
    expect(captureAWSv3ClientSpy.calledOnceWith(awsClientS3)).toBe(true);
  });

  it('should log info messages correctly', () => {
    loggerInfoSpy = sinon.spy(commons.logger, 'info');
    const details = { key: 'value' };

    commons.logInfo(module, msg, details);

    sinon.assert.calledOnceWithExactly(loggerInfoSpy, msg, {
      module,
      data: details
    });
  });

  it('should log debug messages correctly', () => {
    loggerDebugSpy = sinon.spy(commons.logger, 'debug');
    const details = { key: 'value' };

    commons.logDebug(module, msg, details);

    sinon.assert.calledOnceWithExactly(loggerDebugSpy, msg, {
      module,
      data: details
    });
  });

  it('should log error messages correctly', () => {
    loggerErrorSpy = sinon.spy(commons.logger, 'error');
    const details = { key: 'value' };
    const security = true;

    commons.logError(module, msg, details, security);

    sinon.assert.calledOnceWithExactly(loggerErrorSpy, msg, {
      module,
      security,
      data: details
    });
  });
});
