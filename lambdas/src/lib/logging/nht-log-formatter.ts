import { LogFormatter, LogItem } from '@aws-lambda-powertools/logger';
import {
  type LogAttributes,
  type UnformattedAttributes
} from '@aws-lambda-powertools/logger/types';

class NhtLogFormatter extends LogFormatter {
  public formatAttributes(
    attributes: UnformattedAttributes,
    additionalLogAttributes: LogAttributes
  ): LogItem {
    const baseAttributes = {
      msg: attributes.message,
      logLevel: attributes.logLevel,
      lambda: attributes.serviceName,
      coldStart: attributes.lambdaContext?.coldStart,
      timestamp: attributes.timestamp,
      metadata: {
        awsRequestId: attributes.lambdaContext?.awsRequestId,
        xRayTraceId: attributes.xRayTraceId
      },
      version: process.env.NHT_VERSION ?? '',
      appId: process.env.APP_ID ?? ''
    };

    const logItem = new LogItem({ attributes: baseAttributes });
    logItem.addAttributes(additionalLogAttributes);
    return logItem;
  }
}

export { NhtLogFormatter };
