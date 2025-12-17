import { type Context, type SQSRecord } from 'aws-lambda';
import Sinon from 'ts-sinon';
import { XrayTraceService } from '../../../src/lib/aws/xray-trace-helper';
import { Commons } from '../../../src/lib/commons';

const mockedSetSegment = jest.fn();
const mockedProcessTraceData = jest.fn();

jest.mock('aws-xray-sdk', () => ({
  ...jest.requireActual('aws-xray-sdk'),
  setSegment: () => mockedSetSegment,
  utils: {
    processTraceData: () => mockedProcessTraceData
  }
}));

describe('XrayTraceService', () => {
  const functionName = 'splitter';
  const awsTraceHeader = 'header';
  const lambdaExecStartTime = 20;
  const firstReceiveTimestamp = 10000;
  const traceData = {
    root: '1-5759e988-bd862e3fe1be46a994272793',
    parent: '53995c3f42cd8ad8'
  };
  const record = {
    attributes: {
      AWSTraceHeader: awsTraceHeader,
      ApproximateFirstReceiveTimestamp: firstReceiveTimestamp
    }
  } as unknown as SQSRecord;
  const context = {
    functionName,
    invokedFunctionArn: 'arn1234',
    awsRequestId: '1234566abcd'
  } as unknown as Context;
  const sandbox = Sinon.createSandbox();
  const commonsStub = sandbox.createStubInstance(Commons);

  const xrayTraceService: XrayTraceService = new XrayTraceService(
    commonsStub as unknown as Commons
  );

  beforeEach(() => {
    mockedSetSegment.mockReturnValue({});
    mockedProcessTraceData.mockReturnValue(traceData);
  });

  afterEach(() => {
    sandbox.reset();
    mockedSetSegment.mockReset();
  });

  test('createTraceSegment should return a new segment', () => {
    const segment = xrayTraceService.createTraceSegment(
      record,
      context,
      lambdaExecStartTime
    );

    expect(segment).toMatchObject({
      name: functionName,
      origin: 'AWS::Lambda::Function',
      start_time: 10
    });
  });
});
