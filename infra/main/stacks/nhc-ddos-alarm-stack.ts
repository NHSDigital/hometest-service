/* eslint-disable no-new */
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { type Construct } from 'constructs';
import { BaseStack } from '../../common/base-stack';
import { type StackProps } from 'aws-cdk-lib';
import { type NHCEnvVariables } from '../settings';
import * as cdk from 'aws-cdk-lib';
import { type DimensionMap } from 'aws-sdk/clients/pi';
import { type NhsAlarmFactory } from '../../common/nhc-alarm-factory';
import { ResourceNamingService } from '../../common/resource-naming-service';
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal
} from 'aws-cdk-lib/aws-iam';
import { Rule, EventBus } from 'aws-cdk-lib/aws-events';

interface NhcDDOSAlarmStackProps extends StackProps {
  envVariables: NHCEnvVariables;
  cloudfrontArn: string;
  securityAlarmFactory: NhsAlarmFactory;
}

interface AlarmDetails {
  name: string;
  enabled: boolean;
  description: string;
  threshold: number;
  evaluationPeriods: number;
  dimensions: DimensionMap;
}

interface AlarmWithMetrics {
  metricName: string;
  alarmDetails: AlarmDetails;
}

export class NhcDDOSAlarmStack extends BaseStack {
  private readonly namingService: ResourceNamingService;

  constructor(scope: Construct, id: string, props: NhcDDOSAlarmStackProps) {
    super(
      scope,
      id,
      props.envVariables.common.envName,
      props.envVariables.nhcVersion,
      'us-east-1',
      true
    );
    this.namingService = new ResourceNamingService(
      props.envVariables.common.envName
    );
    if (props.envVariables.alarmsEnabled) {
      const alarms = this.enableAlarms(
        props.cloudfrontArn,
        props.securityAlarmFactory
      );
      if (props.envVariables.csocLogForwardingEnabled) {
        this.enableCsocEventForwarding(
          props.envVariables.csocEventBusArn,
          alarms
        );
      }
    }
  }

  private enableAlarms(
    cloudfrontDistributionArn: string,
    alarmFactory: NhsAlarmFactory
  ): { alarmArn: string; metricName: string }[] {
    const alarms: AlarmWithMetrics[] = [
      {
        metricName: 'DDoSDetected',
        alarmDetails: {
          name: 'DDOSDetection',
          enabled: true,
          description: 'Triggers when a DDoS attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 20,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionSYNFlood',
          enabled: true,
          description:
            'Triggers when a DDoS SYN Flood attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'SYNFlood'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionACKFlood',
          enabled: true,
          description:
            'Triggers when a DDoS ACK Flood attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'ACKFlood'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionFINFlood',
          enabled: true,
          description:
            'Triggers when a DDoS FIN Flood attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'FINFlood'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionRSTFlood',
          enabled: true,
          description:
            'Triggers when a DDoS RST Flood attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'RSTFlood'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionChargenReflection',
          enabled: true,
          description:
            'Triggers when a DDoS Chargen Reflection attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'ChargenReflection'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionDNSReflection',
          enabled: true,
          description:
            'Triggers when a DDoS DNSReflection attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'DNSReflection'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionUDSReflection',
          enabled: true,
          description:
            'Triggers when a DDoS UDS Reflection attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'UDSReflection'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionMemcachedReflection',
          enabled: true,
          description:
            'Triggers when a DDoS Memcached Reflection attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'MemcachedReflection'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionPacketFlood',
          enabled: true,
          description:
            'Triggers when a DDoS Packet Flood attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'PacketFlood'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionMSSQLReflection',
          enabled: true,
          description:
            'Triggers when a DDoS MSSQL Reflection attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'MSSQLReflection'
          }
        }
      },
      {
        metricName: 'DDoSAttackRequestsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionHTTPReflection',
          enabled: true,
          description:
            'Triggers when a DDoS HTTP Reflection attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'HTTPReflection'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionNetBIOSReflection',
          enabled: true,
          description:
            'Triggers when a DDoS NetBIOS Reflection attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'NetBIOSReflection'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionNTPReflection',
          enabled: true,
          description:
            'Triggers when a DDoS NTP Reflection attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'NTPReflection'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionPortMapper',
          enabled: true,
          description:
            'Triggers when a DDoS Port Mapper attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'PortMapper'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionRIPReflection',
          enabled: true,
          description:
            'Triggers when a DDoS RIP Reflection attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'RIPReflection'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionSNMPReflection',
          enabled: true,
          description:
            'Triggers when a DDoS SNMP Reflection attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'SNMPReflection'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionSSDPReflection',
          enabled: true,
          description:
            'Triggers when a DDoS SSDP Reflection attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'SSDPReflection'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionUDPFragment',
          enabled: true,
          description:
            'Triggers when a DDoS UDP Fragment attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'UDPFragment'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionUDPTraffic',
          enabled: true,
          description:
            'Triggers when a DDoS UDP Traffic attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'UDPTraffic'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionUDPReflection',
          enabled: true,
          description:
            'Triggers when a DDoS UDP Reflection attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'UDPReflection'
          }
        }
      },
      {
        metricName: 'DDoSAttackBitsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionGenericUDPReflection',
          enabled: true,
          description:
            'Triggers when a DDoS Generic UDP Reflection attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'GenericUDPReflection'
          }
        }
      },
      {
        metricName: 'DDoSAttackRequestsPerSecond',
        alarmDetails: {
          name: 'DDOSDetectionRequestFlood',
          enabled: true,
          description:
            'Triggers when a DDoS Request Flood attack is detected by AWS Shield',
          threshold: 1,
          evaluationPeriods: 3,
          dimensions: {
            ResourceArn: cloudfrontDistributionArn,
            AttackVector: 'RequestFlood'
          }
        }
      }
    ];

    // Iterate over alarms and call the function, collecting alarm ARNs
    const createdAlarms: { alarmArn: string; metricName: string }[] = [];
    for (const alarm of alarms) {
      const alarmResource = this.createAlarm(alarm, alarmFactory);
      if (alarmResource && alarmResource.alarmArn) {
        createdAlarms.push({
          alarmArn: alarmResource.alarmArn,
          metricName: alarm.metricName
        });
      }
    }
    return createdAlarms;
  }

  private enableCsocEventForwarding(
    csocEventBusArn: string,
    alarms: { alarmArn: string; metricName: string }[]
  ): void {
    // Create a role for ShieldAdvanced to write events
    const cloudfrontShieldAdvancedCsocRole = new Role(
      this,
      'cloudfrontShieldAdvancedCsocRole',
      {
        assumedBy: new ServicePrincipal('events.amazonaws.com', {
          conditions: {
            StringEquals: {
              'aws:SourceAccount': cdk.Stack.of(this).account
            }
          }
        }),
        roleName: `aws-cloudfront-csoc-role-${this.envName}-${this.region}`
      }
    );

    cloudfrontShieldAdvancedCsocRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['events:PutEvents'],
        resources: [csocEventBusArn]
      })
    );

    for (const alarm of alarms) {
      if (alarm.metricName === 'DDoSDetected') {
        new Rule(this, 'CloudFrontDDoSAlarmEventRule', {
          ruleName: `${this.envName}-shield-ddos-rule-${cdk.Stack.of(this).account}`,
          eventBus: EventBus.fromEventBusName(this, 'DefaultBus', 'default'),
          eventPattern: {
            source: ['aws.cloudwatch'],
            detailType: ['CloudWatch Alarm State Change'],
            resources: [alarm.alarmArn]
          },
          targets: [
            new cdk.aws_events_targets.EventBus(
              EventBus.fromEventBusArn(this, 'CSOCEventBus', csocEventBusArn),
              {
                role: cloudfrontShieldAdvancedCsocRole
              }
            )
          ]
        });
      }
    }
  }

  private createAlarm(
    alarm: AlarmWithMetrics,
    alarmFactory: NhsAlarmFactory
  ): cloudwatch.Alarm | undefined {
    // Get existing Metric
    const existingDDOSMetric = new cloudwatch.Metric({
      namespace: 'AWS/DDoSProtection',
      metricName: alarm.metricName,
      statistic: cloudwatch.Stats.MAXIMUM,
      period: cdk.Duration.minutes(5),
      dimensionsMap: alarm.alarmDetails.dimensions,
      region: 'us-east-1'
    });

    // Create a CloudWatch alarm and return it
    const createdAlarm = alarmFactory.create(this, alarm.alarmDetails.name, {
      metric: existingDDOSMetric,
      alarmName: this.namingService.getEnvSpecificResourceName(
        alarm.alarmDetails.name
      ),
      threshold: alarm.alarmDetails.threshold,
      evaluationPeriods: alarm.alarmDetails.evaluationPeriods,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: alarm.alarmDetails.description,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      actionsEnabled: alarm.alarmDetails.enabled
    });
    return createdAlarm === null ? undefined : createdAlarm;
  }
}
