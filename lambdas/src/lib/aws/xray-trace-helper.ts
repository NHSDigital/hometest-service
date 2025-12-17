import { type Context, type SQSRecord } from 'aws-lambda';
import { Segment, setSegment, utils } from 'aws-xray-sdk';
import { type Commons } from '../commons';
import { Service } from '../service';

export class XrayTraceService extends Service {
  constructor(commons: Commons) {
    super(commons, 'XrayTraceService');
  }

  public createTraceSegment(
    record: SQSRecord,
    context: Context,
    lambdaExecStartTime: number
  ): Segment {
    const traceHeaderStr = record.attributes?.AWSTraceHeader;
    const traceData = utils.processTraceData(traceHeaderStr);
    const sqsSegmentEndTime =
      Number(record.attributes?.ApproximateFirstReceiveTimestamp) / 1000;
    this.logger.info('xRay stats', {
      lambdaExecStartTime,
      sqsSegmentEndTime,
      traceData,
      traceHeaderStr
    });

    const lambdaSegment = new Segment(
      context.functionName,
      traceData.root,
      traceData.parent
    );
    lambdaSegment.origin = 'AWS::Lambda::Function';
    lambdaSegment.start_time =
      lambdaExecStartTime - (lambdaExecStartTime - sqsSegmentEndTime);
    lambdaSegment.addPluginData({
      function_arn: context.invokedFunctionArn,
      region: 'eu-west-2',
      request_id: context.awsRequestId
    });

    // Set it as the current Segment
    setSegment(lambdaSegment);

    return lambdaSegment;
  }
}
