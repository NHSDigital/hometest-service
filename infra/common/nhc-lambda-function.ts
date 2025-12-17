import {
  NodejsFunction,
  OutputFormat,
  type NodejsFunctionProps
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import type { Construct } from 'constructs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { IKey } from 'aws-cdk-lib/aws-kms';
import { ResourceNamingService } from './resource-naming-service';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { type NhsAlarmFactory } from './nhc-alarm-factory';

const nodeRuntime = Runtime.NODEJS_24_X;
const defaultTimeout = Duration.seconds(10);

export interface LambdaAlarmConfig {
  createLambdaErrorAlarm?: boolean; // defaults to true
  createLambdaDurationAlarm?: boolean; // defaults to true
  durationAlarmThreshold?: Duration;
  createLambdaNotInvokedAlarm?: boolean;
  createLambdaNotInvokedAlarmPeriod?: Duration;
  createLambdaThrottlesAlarm?: boolean;
}

export class NhcLambdaFunction extends NodejsFunction {
  private readonly scope: Construct;
  private readonly namingService: ResourceNamingService;

  constructor(
    props: {
      scope: Construct;
      id: string;
      stackName: string;
      environment?: Record<string, string>;
      additionalProps?: Partial<NodejsFunctionProps>;
      alarmsConfig?: LambdaAlarmConfig;
      alarmFactory: NhsAlarmFactory;
      encryptionKey: IKey; // KMS key for log group and env variables encryption
    },
    nhcName?: string
  ) {
    const envName = process.env.HEALTH_CHECK_ENVIRONMENT ?? 'dev';
    const nhcVersion = process.env.NHC_VERSION ?? '';
    const appId = process.env.APP_ID ?? '';
    const lambdaMemorySize = parseInt(process.env.LAMBDA_MEMORY_SIZE ?? '1536');
    const awsXrayContextMissingAction =
      process.env.AWS_XRAY_CONTEXT_MISSING ?? 'IGNORE_ERROR';
    const logLevel = process.env.LOG_LEVEL ?? 'INFO';
    const tracingEnabled = process.env.TRACING_ENABLED === 'true';
    const awsResourcesRemovalPolicy =
      process.env.AWS_RESOURCES_REMOVAL_POLICY ?? '';
    const namingService = new ResourceNamingService(envName);

    const logGroupName = `${props.id}-log-group`;
    const logGroup = new LogGroup(props.scope, logGroupName, {
      logGroupName:
        '/aws/lambda/' +
        namingService.getEnvSpecificResourceName(logGroupName, nhcName),
      removalPolicy:
        RemovalPolicy[
          awsResourcesRemovalPolicy as keyof typeof RemovalPolicy
        ] ?? RemovalPolicy.RETAIN,
      retention:
        parseInt(process.env.LOG_RETENTION_IN_DAYS ?? '') ||
        RetentionDays.INFINITE,
      encryptionKey: props.encryptionKey
    });

    const lambdaName = namingService.getEnvSpecificResourceName(
      props.id,
      nhcName
    );
    const updatedProps: NodejsFunctionProps = {
      memorySize: lambdaMemorySize,
      functionName: lambdaName,
      logGroup,
      ...props.additionalProps,
      entry: path.join(
        __dirname,
        './../../lambdas/src',
        props.stackName,
        props.id,
        'index.ts'
      ),
      handler: 'handler',
      runtime: nodeRuntime,
      timeout: props.additionalProps?.timeout ?? defaultTimeout,
      bundling: {
        // https://github.com/evanw/esbuild/pull/2067
        banner:
          "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
        format: OutputFormat.ESM,
        target: 'esnext',
        externalModules: ['@aws-sdk/*'],
        commandHooks:
          props.additionalProps?.bundling?.commandHooks ?? undefined,
        minify: true
      },
      depsLockFilePath: path.join(
        __dirname,
        './../../lambdas',
        'package-lock.json'
      ),
      environment: {
        ENV_NAME: envName,
        NHC_VERSION: nhcVersion,
        APP_ID: appId,
        LOG_LEVEL: logLevel,
        POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'true',
        POWERTOOLS_TRACE_ENABLED: tracingEnabled.toString(),
        /*
         * The AWS X-Ray SDK wasn't built with top-level await in mind, so it logs errors when
         * trace data is sent outside a request context (common during Lambda's init phase).
         * Since we perform async setup tasks (like HTTP calls and AWS SDK operations) during init,
         * Tracer’s auto-instrumentation tries to create segments but fails due to missing context
         * and logs an error. Providing this environment variable allows us to suppress the error.
         * https://github.com/aws-powertools/powertools-lambda-typescript/issues/2406
         * https://github.com/aws-powertools/powertools-lambda-typescript/pull/3058
         */
        AWS_XRAY_CONTEXT_MISSING: awsXrayContextMissingAction,
        ...props.environment
      },
      tracing: tracingEnabled ? Tracing.ACTIVE : Tracing.DISABLED,
      environmentEncryption: props.encryptionKey
    };

    super(props.scope, props.id, updatedProps);
    this.namingService = namingService;
    this.scope = props.scope;
    if (props.alarmsConfig?.createLambdaDurationAlarm !== false) {
      this.createExecutionDurationAlarm(
        lambdaName,
        props.alarmFactory,
        props.alarmsConfig?.durationAlarmThreshold
      );
    }
    if (props.alarmsConfig?.createLambdaErrorAlarm !== false) {
      this.createErrorAlarm(lambdaName, props.alarmFactory, nhcName);
    }
    if (props.alarmsConfig?.createLambdaNotInvokedAlarm ?? false) {
      if (!props.alarmsConfig?.createLambdaNotInvokedAlarmPeriod) {
        throw new Error(
          `createLambdaNotInvokedAlarmPeriod must be set if createLambdaNotInvokedAlarm is enabled`
        );
      }
      this.createNoInvocationsAlarm(
        lambdaName,
        props.alarmsConfig?.createLambdaNotInvokedAlarmPeriod,
        props.alarmFactory
      );
    }
    if (props.alarmsConfig?.createLambdaThrottlesAlarm ?? false) {
      this.createThrottlesAlarm(lambdaName, props.alarmFactory);
    }
  }

  private createErrorAlarm(
    lambdaName: string,
    alarmFactory: NhsAlarmFactory,
    nhcName?: string
  ): void {
    const genericLambdaError = `lambda-error-${lambdaName}`;

    alarmFactory.create(this.scope, genericLambdaError, {
      metric: this.metricErrors(),
      threshold: 1,
      evaluationPeriods: 3,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm triggered when a lambda throws an exit error',
      alarmName: this.namingService.getEnvSpecificResourceName(
        genericLambdaError,
        nhcName
      )
    });
  }

  private createNoInvocationsAlarm(
    lambdaName: string,
    periodToCheck: Duration,
    alarmFactory: NhsAlarmFactory
  ): void {
    const notRunLambdaError = `lambda-not-run-${lambdaName}`;

    alarmFactory.create(this.scope, notRunLambdaError, {
      metric: this.metricInvocations({ period: periodToCheck }),
      threshold: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription:
        'Alarm triggered when a lambda was not run in a given time period',
      alarmName:
        this.namingService.getEnvSpecificResourceName(notRunLambdaError)
    });
  }

  private createExecutionDurationAlarm(
    lambdaName: string,
    alarmFactory: NhsAlarmFactory,
    timeoutAlarmThreshold?: Duration
  ): void {
    const durationLambdaError = `lambda-exec-duration-${lambdaName}`;
    alarmFactory.create(this.scope, durationLambdaError, {
      metric: this.metricDuration({
        statistic: cloudwatch.Stats.MAXIMUM
      }),
      threshold:
        timeoutAlarmThreshold?.toMilliseconds() ??
        (this.timeout ?? defaultTimeout).toMilliseconds() * 0.7,
      evaluationPeriods: 3,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription:
        'Alarm triggered when a lambda has taken abnormally long time to finish',
      alarmName:
        this.namingService.getEnvSpecificResourceName(durationLambdaError)
    });
  }

  private createThrottlesAlarm(
    lambdaName: string,
    alarmFactory: NhsAlarmFactory
  ): void {
    const throttlesLambdaError = `lambda-throttles-${lambdaName}`;
    alarmFactory.create(this.scope, throttlesLambdaError, {
      metric: this.metricThrottles(),
      threshold: 1,
      evaluationPeriods: 3,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm triggered when a lambda has been throttled',
      alarmName:
        this.namingService.getEnvSpecificResourceName(throttlesLambdaError)
    });
  }
}
