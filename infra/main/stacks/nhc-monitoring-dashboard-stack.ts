import { BaseStack } from '../../common/base-stack';
import { type Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { ResourceNamingService } from '../../common/resource-naming-service';
import { Duration, type StackProps } from 'aws-cdk-lib';
import { type NHCEnvVariables } from '../settings';
import { type ILogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId
} from 'aws-cdk-lib/custom-resources';

interface NhcMonitoringDashboardStackProps extends StackProps {
  eventAuditLambdaLogGroup: ILogGroup;
  healthCheckInitLambdaLogGroup: ILogGroup;
  labOrderPlacementLambdaLogGroup: ILogGroup;
  updatePatientRecordLambdaLogGroup: ILogGroup;
  loginLambdaLogGroup: ILogGroup;
  redriveDlqMessagesLambdaLogGroup: ILogGroup;
  healthCheckApiLogGroup: ILogGroup;
  envVariables: NHCEnvVariables;
}

export class NhcMonitoringDashboardStack extends BaseStack {
  customResourcesLogGroup: ILogGroup;
  constructor(
    scope: Construct,
    id: string,
    props: NhcMonitoringDashboardStackProps
  ) {
    super(
      scope,
      id,
      props.envVariables.common.envName,
      props.envVariables.nhcVersion
    );
    const dashNameSpace = 'ServiceUserMonitoring';
    const technicalDashNameSpace = 'TechnicalMonitoring';
    const namingService = new ResourceNamingService(
      props.envVariables.common.envName
    );

    this.customResourcesLogGroup = new LogGroup(
      this,
      'monitoring-dashboard-custom-resources-log-group',
      {
        logGroupName: `/aws/lambda/${this.envName}-monitoring-dashboard-custom-resources`,
        retention:
          parseInt(process.env.LOG_RETENTION_IN_DAYS ?? '') ||
          RetentionDays.ONE_MONTH,
        encryptionKey: this.getKmsKeyById(
          props.envVariables.aws.managementAccountId,
          props.envVariables.security.kmsKeyId
        )
      }
    );

    const generalStatsChart = new cloudwatch.LogQueryWidget({
      title: 'Overview',
      logGroupNames: [
        props.healthCheckInitLambdaLogGroup.logGroupName,
        props.labOrderPlacementLambdaLogGroup.logGroupName,
        props.updatePatientRecordLambdaLogGroup.logGroupName
      ],
      queryLines: [
        'fields @timestamp, @message, @logStream, @log,',
        '  if(data.eventType = "HealthCheckCreated", "Number of individuals that start a DNHC",',
        '    if(data.eventType = "BloodTestOrdered", "Number of individuals that ordered a cholesterol blood self-sampling kit",',
        '      if(data.eventType = "DnhcResultsWrittenToGp", "Number of individuals that completed DNHC", data.eventType)',
        '    )',
        '  ) as Metric',
        "filter msg = 'Audit event created' and data.eventType like /HealthCheckCreated|BloodTestOrdered|DnhcResultsWrittenToGp/",
        'stats count(*) as count_uniq by Metric, data.healthCheckId',
        'stats count(Metric) as Number by Metric'
      ],
      view: cloudwatch.LogQueryVisualizationType.TABLE,
      width: 24,
      height: 4
    });

    const userDropOutChart = new cloudwatch.LogQueryWidget({
      title:
        'Number of individuals dropping out of their DNHC to complete an emergency pathway',
      logGroupNames: [props.eventAuditLambdaLogGroup.logGroupName],
      // Query returns one row per event type with its count:
      queryLines: [
        'fields @timestamp, @message, @logStream, @log,',
        '  if(data.eventType = "UrgentHighBloodPressure", "Urgent High Blood Pressure",',
        '    if(data.eventType = "UrgentLowBloodPressure", "Urgent Low Blood Pressure",',
        '      if(data.eventType = "CantDoHbA1cShutterScreen", "Unable to perform HbA1c", data.eventType)',
        '    )',
        '  ) as Reason',
        "filter msg = 'Audit event created' and data.eventType like /UrgentHighBloodPressure|UrgentLowBloodPressure|CantDoHbA1cShutterScreen/",
        'stats count(*) as count_uniq by Reason, data.healthCheckId',
        'stats count(Reason) as Number by Reason'
      ],
      view: cloudwatch.LogQueryVisualizationType.TABLE,
      width: 24,
      height: 4
    });

    const eligibilityChart = new cloudwatch.LogQueryWidget({
      title:
        "Eligibility - Number of occurrences where a user's NHS Number is not on the allowed list",
      logGroupNames: [props.loginLambdaLogGroup.logGroupName],
      queryLines: [
        'fields @timestamp, @message, @logStream, @log',
        'filter msg = "Audit event created" and data.eventType="PatientIneligibleInvalidNHSNumber"',
        'stats count(*) as Number'
      ],
      view: cloudwatch.LogQueryVisualizationType.TABLE,
      width: 24,
      height: 4
    });

    const dashboard = new cloudwatch.Dashboard(this, dashNameSpace, {
      defaultInterval: Duration.hours(1),
      dashboardName: namingService.getEnvSpecificResourceName(dashNameSpace)
    });
    dashboard.addWidgets(generalStatsChart, userDropOutChart, eligibilityChart);

    const technicalDashboard = new cloudwatch.Dashboard(
      this,
      technicalDashNameSpace,
      {
        defaultInterval: Duration.hours(1),
        dashboardName: namingService.getEnvSpecificResourceName(
          technicalDashNameSpace
        )
      }
    );

    const messageReDrivesChart = new cloudwatch.LogQueryWidget({
      title: 'Number of all redriven DLQ messages by queue',
      logGroupNames: [props.redriveDlqMessagesLambdaLogGroup.logGroupName],
      queryLines: [
        'fields @timestamp, @message',
        'filter msg = "MESSAGE REDRIVEN"',
        'stats count(*) as Number by data.queueName',
        'order by Number desc'
      ],
      view: cloudwatch.LogQueryVisualizationType.TABLE,
      width: 24,
      height: 4
    });

    const distinctIpAddressesChart = new cloudwatch.LogQueryWidget({
      title: 'Number of distinct IP addresses accessing the service',
      logGroupNames: [props.healthCheckApiLogGroup.logGroupName],
      queryLines: [
        'fields @timestamp, @message',
        'parse @message /(?<ip>[0-9]+.[0-9]+.[0-9]+.[0-9]+)/',
        'parse @message /"(?<method>[A-Z]+) (?<path>[^ ]+) (?<http_version>[^"]+)"/',
        'filter resourcePath = "/patient" or path = "/patient"',
        'stats count_distinct(ip) as Number'
      ],
      view: cloudwatch.LogQueryVisualizationType.TABLE,
      width: 24,
      height: 4
    });

    technicalDashboard.addWidgets(
      messageReDrivesChart,
      distinctIpAddressesChart
    );

    // Creating widgets that include failed audit events monitoring.
    // They depend on the RUM logs, so if RUM Cloud Watch logs are disabled, the widgets won't be created
    if (props.envVariables.rumCloudwatchLogsEnabled) {
      const rumLogGroupName = this.getRumLogGroupName(
        this.customResourcesLogGroup as LogGroup
      );
      if (rumLogGroupName === undefined || rumLogGroupName.length === 0) {
        console.log(
          "Technical dashboard won't be created because RUM log group can't be found"
        );
        return;
      }

      const failedAuditEventsByTypeChart = new cloudwatch.LogQueryWidget({
        title:
          'Number of failed audit event requests from UI by audit event type',
        logGroupNames: [rumLogGroupName],
        queryLines: [
          'fields event_details.auditEventType as AuditEventType',
          'filter event_type="EVENT_AUDIT_ERROR"',
          'stats count(*) as Number by AuditEventType',
          'sort Number desc'
        ],
        view: cloudwatch.LogQueryVisualizationType.TABLE,
        width: 24,
        height: 4
      });

      const allFailedAuditEventsChart = new cloudwatch.LogQueryWidget({
        title: 'Number of all failed audit event requests from UI',
        logGroupNames: [rumLogGroupName],
        queryLines: [
          'fields @message',
          'filter event_type="EVENT_AUDIT_ERROR"',
          'stats count(*) as Number'
        ],
        view: cloudwatch.LogQueryVisualizationType.TABLE,
        width: 24,
        height: 4
      });

      technicalDashboard.addWidgets(
        allFailedAuditEventsChart,
        failedAuditEventsByTypeChart
      );
    }
  }

  getRumLogGroupName(customLambdaLogGroup: LogGroup): string | undefined {
    const describeLogGroupsResource = new AwsCustomResource(
      this,
      'describe-rum-log-groups-resource',
      {
        functionName: `${this.envName}-nhc-describe-rum-log-groups-custom-resource`,
        onCreate: {
          service: 'CloudWatchLogs',
          action: 'describeLogGroups',
          parameters: {
            logGroupNamePrefix: `/aws/vendedlogs/RUMService_${this.envName}`
          },
          physicalResourceId: PhysicalResourceId.of('DescribeLogGroups')
        },
        policy: AwsCustomResourcePolicy.fromSdkCalls({
          resources: AwsCustomResourcePolicy.ANY_RESOURCE
        }),
        logGroup: customLambdaLogGroup
      }
    );

    try {
      return describeLogGroupsResource.getResponseField(
        'logGroups.0.logGroupName'
      );
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }
}
