import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { NhtLogFormatter } from './logging/nht-log-formatter';
import { type LogLevel } from '@aws-lambda-powertools/logger/types';
import { Tracer } from '@aws-lambda-powertools/tracer';

export class Commons {
  private readonly stackName: string;
  private readonly lambdaName: string;

  public readonly metrics: Metrics;
  public readonly logger: Logger;

  public tracer: Tracer;
  public correlationId: string | string[];
  public nhtVersion: string;
  public homeTestingDataModelVersion: string;
  public appId: string;

  constructor(stackName: string, lambdaName: string) {
    this.stackName = stackName;
    this.lambdaName = lambdaName;
    this.nhtVersion = process.env.NHT_VERSION ?? '';
    this.homeTestingDataModelVersion =
      process.env.HOME_TESTING_DATA_MODEL_VERSION ?? '';
    this.appId = process.env.APP_ID ?? '';
    this.metrics = new Metrics({
      namespace: `nht.${stackName}`,
      serviceName: lambdaName
    });

    this.logger = new Logger({
      logLevel:
        process.env.SILENT_LOGGING === 'true'
          ? 'SILENT'
          : ((process.env.LOG_LEVEL as LogLevel) ?? 'INFO'),
      serviceName: lambdaName,
      logFormatter: new NhtLogFormatter()
    });
  }

  setUpTracing(awsClient: any): void {
    if (this.tracer === undefined) {
      this.tracer = new Tracer({
        serviceName: `${this.stackName}-${this.lambdaName}`
      });
      this.tracer.provider.setLogger(this.logger);
    }
    this.tracer.captureAWSv3Client(awsClient);
  }

  logInfo(module: string, msg: string, details?: Record<string, any>): void {
    this.logger.info(msg, { module, data: details });
  }

  logDebug(module: string, msg: string, details?: Record<string, any>): void {
    this.logger.debug(msg, { module, data: details });
  }

  logError(
    module: string,
    msg: string,
    details?: Record<string, any>,
    security?: boolean
  ): void {
    this.logger.error(msg, { module, security, data: details });
  }
}
