import {
  type NhcReportingStack,
  type NhcReportingStackProps
} from './nhc-reporting-stack';
import { type Bucket } from 'aws-cdk-lib/aws-s3';
import {
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal
} from 'aws-cdk-lib/aws-iam';
import {
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  KeyPair,
  MachineImage,
  Peer,
  Port,
  SecurityGroup,
  Vpc
} from 'aws-cdk-lib/aws-ec2';
import {
  CfnAssociation,
  CfnDocument,
  CfnMaintenanceWindow,
  CfnMaintenanceWindowTarget,
  CfnMaintenanceWindowTask,
  StringParameter
} from 'aws-cdk-lib/aws-ssm';
import { EnvType, NhcTopic } from '../../../common/lib/enums';
import { SnsTopic } from 'aws-cdk-lib/aws-events-targets';
import type { ITopic } from 'aws-cdk-lib/aws-sns';
import { Tags } from 'aws-cdk-lib';
import { Rule } from 'aws-cdk-lib/aws-events';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId
} from 'aws-cdk-lib/custom-resources';
import { AlertTopic } from '../../../common/nhc-alarm-factory';
import { CfnLifecyclePolicy } from 'aws-cdk-lib/aws-dlm';
import { type ILogGroup, LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { CfnWorkGroup } from 'aws-cdk-lib/aws-athena';

export function createEc2Resources(
  scope: NhcReportingStack,
  props: NhcReportingStackProps,
  outputBucket: Bucket,
  workGroup: CfnWorkGroup
): void {
  const alertTopic = AlertTopic.getTopic(scope, NhcTopic.STANDARD);
  const snsPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['sns:Publish'],
    resources: [alertTopic.topicArn]
  });
  const snsKmsKey = scope.lookupKmsKeyByAlias(
    props.envVariables.security.snsKmsKeyAliasName
  );

  const kmsPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['kms:GenerateDataKey*', 'kms:Decrypt', 'kms:DescribeKey'],
    resources: [`arn:aws:kms:eu-west-2:${scope.account}:key/${snsKmsKey.keyId}`]
  });

  const customEc2ResourcesLogGroup = new LogGroup(
    scope,
    'reporting-custom-ec2-resources-log-group',
    {
      logGroupName: `/aws/lambda/${scope.envName}-reporting-custom-ec2-resources`,
      retention:
        parseInt(process.env.LOG_RETENTION_IN_DAYS ?? '') ||
        RetentionDays.ONE_MONTH,
      encryptionKey: scope.kmsKey
    }
  );

  const ec2InstanceRole = new Role(scope, 'ec2-instance-role', {
    assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    roleName: `nhc-power-bi-gateway-${props.envVariables.common.envName}-role`
  });
  scope.addAthenaAndGluePolicies(ec2InstanceRole, outputBucket, workGroup.name);
  ec2InstanceRole.addManagedPolicy(
    ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
  );
  ec2InstanceRole.addManagedPolicy(
    ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy')
  );
  ec2InstanceRole.addToPolicy(snsPolicy);
  ec2InstanceRole.addToPolicy(kmsPolicy);

  const vpc = Vpc.fromLookup(scope, 'ec2-vpc', {
    vpcId: props.envVariables.vpc.id
  });
  const ec2SecurityGroup = new SecurityGroup(scope, 'power-bi-security-group', {
    vpc,
    securityGroupName: `${props.envVariables.common.envName}-power-bi-security-group`,
    allowAllOutbound: false,
    allowAllIpv6Outbound: false
  });
  ec2SecurityGroup.addEgressRule(
    Peer.anyIpv4(),
    Port.tcp(80),
    'TCP port 80 used by the gateway'
  );
  ec2SecurityGroup.addEgressRule(
    Peer.anyIpv4(),
    Port.tcp(443),
    'TCP port 443 used by the gateway'
  );
  ec2SecurityGroup.addEgressRule(
    Peer.anyIpv4(),
    Port.tcp(5671),
    'TCP port 5671 used by the gateway'
  );
  ec2SecurityGroup.addEgressRule(
    Peer.anyIpv4(),
    Port.tcp(5672),
    'TCP port 5672 used by the gateway'
  );
  ec2SecurityGroup.addEgressRule(
    Peer.anyIpv4(),
    Port.tcpRange(9350, 9354),
    'TCP ports 9350 - 9354 used by the gateway'
  );
  const ec2Instance = new Instance(scope, 'power-bi-ec2-instance', {
    instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.LARGE),
    machineImage: MachineImage.genericWindows({
      'eu-west-2': props.envVariables.reportingEc2Config.reportingEc2AmiId
    }),
    vpc,
    securityGroup: ec2SecurityGroup,
    role: ec2InstanceRole,
    keyPair: KeyPair.fromKeyPairName(
      scope,
      'ec2-key-pair',
      props.envVariables.reportingEc2Config.keyPairName
    ),
    propagateTagsToVolumeOnCreation: true,
    disableApiTermination: props.envVariables.envType === EnvType.PROD,
    detailedMonitoring: props.envVariables.envType === EnvType.PROD
  });

  const patchGroupName = `${props.envVariables.common.envName}-windows-os-app-patch-group`;
  Tags.of(ec2Instance).add('Patch Group', patchGroupName);

  // tag instance for DLM targeting
  Tags.of(ec2Instance).add(
    'PreUpdateSnapshot',
    props.envVariables.common.envName
  );

  const cwAgentConfigParam = new StringParameter(
    scope,
    'power-bi-cloudwatch-agent-config',
    {
      parameterName: `/${scope.envName}/power-bi/cloudwatch-agent-config`,
      stringValue: JSON.stringify({
        agent: {
          metrics_collection_interval: 60,
          logfile:
            'C:\\\\ProgramData\\\\Amazon\\\\CloudWatchAgent\\\\Logs\\\\amazon-cloudwatch-agent.log'
        },
        metrics: {
          namespace: 'NHC/PowerBiEC2',
          append_dimensions: {
            InstanceId: '${aws:InstanceId}'
          },
          metrics_collected: {
            LogicalDisk: {
              measurement: ['% Free Space', 'Free Megabytes'],
              resources: ['C:'],
              metrics_collection_interval: 60
            }
          }
        }
      })
    }
  );

  // Install CloudWatch Agent on the Power BI EC2 instance
  new CfnAssociation(scope, 'install-cloudwatch-agent-association', {
    name: 'AWS-ConfigureAWSPackage',
    associationName: `${scope.envName}-install-cloudwatch-agent`,
    targets: [{ key: 'InstanceIds', values: [ec2Instance.instanceId] }],
    parameters: {
      action: ['Install'],
      name: ['AmazonCloudWatchAgent']
    },
    applyOnlyAtCronInterval: false
  });

  // Configure CloudWatch Agent to publish C: logical disk metrics
  new CfnAssociation(scope, 'configure-cloudwatch-agent-association', {
    name: 'AmazonCloudWatch-ManageAgent',
    associationName: `${scope.envName}-configure-cloudwatch-agent`,
    targets: [{ key: 'InstanceIds', values: [ec2Instance.instanceId] }],
    parameters: {
      action: ['configure'],
      mode: ['ec2'],
      optionalConfigurationSource: ['ssm'],
      optionalConfigurationLocation: [cwAgentConfigParam.parameterName],
      optionalRestart: ['yes']
    },
    applyOnlyAtCronInterval: false
  });

  // create DLM policy to snapshot before updates (Sun before Mon)
  createPreUpdateSnapshotsWithDlm(scope, props.envVariables.envType);

  // create start/stop instance association
  if (
    props.envVariables.reportingEc2Config.instanceStartSchedule &&
    props.envVariables.reportingEc2Config.instanceStopSchedule
  ) {
    const associationRole = new Role(scope, 'association-role', {
      assumedBy: new ServicePrincipal('ssm.amazonaws.com'),
      roleName: `${props.envVariables.common.envName}-bi-reporting-ec2-association-role`,
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
      ]
    });
    associationRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ec2:StartInstances', 'ec2:StopInstances'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'ec2:InstanceID': ec2Instance.instanceId
          }
        }
      })
    );
    associationRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ec2:DescribeInstanceStatus'],
        resources: ['*']
      })
    );
    new CfnAssociation(scope, 'start-instance-association', {
      name: 'AWS-StartEC2Instance',
      associationName: `Start-${scope.envName}-bi-reporting-instance-association`,
      scheduleExpression: `cron(${props.envVariables.reportingEc2Config.instanceStartSchedule})`,
      parameters: {
        InstanceId: [ec2Instance.instanceId],
        AutomationAssumeRole: [associationRole.roleArn]
      },
      applyOnlyAtCronInterval: true
    });
    new CfnAssociation(scope, 'stop-ec2-instance-association', {
      name: 'AWS-StopEC2Instance',
      associationName: `Stop-${scope.envName}-bi-reporting-instance-association`,
      scheduleExpression: `cron(${props.envVariables.reportingEc2Config.instanceStopSchedule})`,
      parameters: {
        InstanceId: [ec2Instance.instanceId],
        AutomationAssumeRole: [associationRole.roleArn]
      },
      applyOnlyAtCronInterval: true
    });
  }

  const alertSnsRole = new Role(scope, 'patch-failure-sns-role', {
    assumedBy: new ServicePrincipal('events.amazonaws.com')
  });
  alertSnsRole.addToPolicy(snsPolicy);
  alertSnsRole.addToPolicy(kmsPolicy);

  // create association for SSM Agent auto-updates
  createSsmAgentUpdateAssociation(
    scope,
    ec2Instance.instanceId,
    props.envVariables.envType,
    alertTopic,
    alertSnsRole
  );

  // create Maintenance Window for Windows patching
  createWindowsPatchMaintenanceWindow(
    scope,
    props.envVariables.envType,
    alertTopic,
    patchGroupName,
    alertSnsRole,
    customEc2ResourcesLogGroup
  );

  // create a runbook for manual updates
  createRunbookForInstanceUpdates(
    scope,
    ec2Instance.instanceId,
    props.envVariables.envType,
    alertTopic,
    alertSnsRole
  );
}

function createSsmAgentUpdateAssociation(
  scope: NhcReportingStack,
  instanceId: string,
  envType: string,
  alertTopic: ITopic,
  alertSnsRole: Role
): void {
  // 1st Monday of each month at 4 am UTC for non-PROD envs, 3rd Monday of the month for PROD
  const cronSchedule =
    envType === EnvType.PROD
      ? 'cron(0 4 ? * MON#3 *)'
      : 'cron(0 4 ? * MON#1 *)';

  const association = new CfnAssociation(
    scope,
    'update-ssm-agent-association',
    {
      name: 'AWS-UpdateSSMAgent',
      associationName: `monthly-${scope.envName}-update-ssm-agent-association`,
      scheduleExpression: cronSchedule,
      complianceSeverity: 'CRITICAL',
      targets: [{ key: 'InstanceIds', values: [instanceId] }],
      applyOnlyAtCronInterval: true
    }
  );

  new Rule(scope, 'ssm-update-association-failure-rule', {
    eventPattern: {
      source: ['aws.ssm'],
      detailType: ['EC2 State Manager Association State Change'],
      detail: {
        'association-id': [association.ref],
        status: ['Failed']
      }
    },
    targets: [
      new SnsTopic(alertTopic, {
        role: alertSnsRole
      })
    ],
    description:
      'Detect failed SSM Agent update associations and notify via SNS'
  });
}

// eslint-disable-next-line max-params
function createWindowsPatchMaintenanceWindow(
  scope: NhcReportingStack,
  envType: string,
  alertTopic: ITopic,
  patchGroupName: string,
  alertSnsRole: Role,
  customEc2ResourcesLogGroup: ILogGroup
): void {
  // 1st Monday of each month at 4:30 am UTC for non-PROD envs, 3rd Monday of the month for PROD
  const cronSchedule =
    envType === EnvType.PROD
      ? 'cron(30 4 ? * MON#3 *)'
      : 'cron(30 4 ? * MON#1 *)';

  const maintenanceWindow = new CfnMaintenanceWindow(
    scope,
    'patch-maintenance-window',
    {
      name: `${scope.envName}-monthly-patch-window`,
      schedule: cronSchedule,
      duration: 3,
      cutoff: 1,
      allowUnassociatedTargets: true
    }
  );

  const instanceTarget = new CfnMaintenanceWindowTarget(
    scope,
    'maintenance-window-target',
    {
      windowId: maintenanceWindow.ref,
      resourceType: 'INSTANCE',
      targets: [
        {
          values: [patchGroupName],
          key: 'tag:Patch Group'
        }
      ],
      name: `${scope.envName}-maintenance-window-target`
    }
  );

  // Create custom resource to register patch group
  new AwsCustomResource(scope, 'register-ssm-patch-group', {
    functionName: `${scope.envName}-nhc-register-patch-group-custom-resource`,
    onCreate: {
      service: 'SSM',
      action: 'registerPatchBaselineForPatchGroup',
      parameters: {
        BaselineId:
          'arn:aws:ssm:eu-west-2:628322100848:patchbaseline/pb-0e79e92c09b9ffc35',
        PatchGroup: patchGroupName
      },
      physicalResourceId: PhysicalResourceId.of(
        `${scope.envName}-patch-group-${patchGroupName}`
      )
    },
    onDelete: {
      service: 'SSM',
      action: 'deregisterPatchBaselineForPatchGroup',
      parameters: {
        BaselineId:
          'arn:aws:ssm:eu-west-2:628322100848:patchbaseline/pb-0e79e92c09b9ffc35',
        PatchGroup: patchGroupName
      }
    },
    policy: AwsCustomResourcePolicy.fromSdkCalls({
      resources: AwsCustomResourcePolicy.ANY_RESOURCE
    }),
    logGroup: customEc2ResourcesLogGroup
  });

  const ssmRole = new Role(scope, 'ssm-service-role', {
    assumedBy: new ServicePrincipal('ssm.amazonaws.com'),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AmazonSSMMaintenanceWindowRole'
      )
    ]
  });
  ssmRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: [`arn:aws:iam::${scope.account}:role/${ssmRole.roleName}`],
      conditions: {
        StringEquals: {
          'iam:PassedToService': 'ssm.amazonaws.com'
        }
      }
    })
  );

  new CfnMaintenanceWindowTask(scope, 'patch-task', {
    windowId: maintenanceWindow.ref,
    targets: [
      {
        key: 'WindowTargetIds',
        values: [instanceTarget.ref]
      }
    ],
    taskArn: 'AWS-RunPatchBaseline',
    taskType: 'RUN_COMMAND',
    serviceRoleArn: ssmRole.roleArn,
    priority: 1,
    maxConcurrency: '1',
    maxErrors: '1',
    name: `${scope.envName}-patch-instances-task`,
    taskInvocationParameters: {
      maintenanceWindowRunCommandParameters: {
        parameters: {
          Operation: ['Install']
        }
      }
    }
  });

  new Rule(scope, 'patch-task-failure-rule', {
    eventPattern: {
      source: ['aws.ssm'],
      detailType: [
        'Maintenance Window Task Execution State-change Notification'
      ],
      detail: {
        'window-id': [maintenanceWindow.ref],
        status: ['FAILED', 'CANCELLED', 'TIMED_OUT']
      }
    },
    targets: [
      new SnsTopic(alertTopic, {
        role: alertSnsRole
      })
    ],
    description:
      'Notifies alert SNS topic if the patching Maintenance Window Task fails'
  });
}

function createRunbookForInstanceUpdates(
  scope: NhcReportingStack,
  instanceId: string,
  envType: string,
  alertTopic: ITopic,
  alertSnsRole: Role
): void {
  const documentName = `nhc-${scope.envName}-update-power-bi-instance-runbook`;

  const runbookRole = new Role(scope, 'runbook-role', {
    assumedBy: new ServicePrincipal('ssm.amazonaws.com'),
    roleName: `${scope.envName}-nhc-update-power-bi-instance-runbook-role`
  });

  // Existing EC2 / SSM permissions
  runbookRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'ec2:StartInstances',
        'ec2:StopInstances',
        'ec2:DescribeInstances',
        'ec2:DescribeTags'
      ],
      resources: [
        `arn:aws:ec2:eu-west-2:${scope.account}:instance/${instanceId}`
      ]
    })
  );
  runbookRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['ec2:DescribeInstanceStatus'],
      resources: ['*']
    })
  );
  runbookRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'ssm:SendCommand',
        'ssm:GetCommandInvocation',
        'ssm:DescribeDocument',
        'ssm:GetDocument',
        'ssm:ListDocuments',
        'ssm:StartAutomationExecution',
        'ssm:GetAutomationExecution',
        'ssm:DescribeAutomationExecutions',
        'ssm:DescribeAutomationStepExecutions'
      ],
      resources: [
        `arn:aws:ec2:eu-west-2:${scope.account}:instance/${instanceId}`,
        `arn:aws:ssm:eu-west-2:${scope.account}:document/${documentName}`,
        'arn:aws:ssm:eu-west-2::document/AWS-*'
      ]
    })
  );
  runbookRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'ssm:DescribeInstanceInformation',
        'ssm:ListCommandInvocations',
        'ssm:ListCommands'
      ],
      resources: ['*']
    })
  );

  // permissions needed for volume resize
  runbookRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'ec2:DescribeInstances',
        'ec2:DescribeVolumes',
        'ec2:ModifyVolume'
      ],
      resources: ['*']
    })
  );

  const automationRunbook = new CfnDocument(
    scope,
    `${scope.envName}-update-power-bi-instance-runbook`,
    {
      name: documentName,
      documentType: 'Automation',
      updateMethod: 'NewVersion',
      content: {
        schemaVersion: '0.3',
        description:
          'This runbook ensures the Power BI EC2 root volume is at least 50 GiB, then updates EC2Launch v2, AWS PV Drivers, Microsoft Visual C++ (x64/x86), Amazon Athena ODBC (64-bit), and Power BI Data Gateway on the Power BI EC2 instance.',
        assumeRole: runbookRole.roleArn,
        parameters: {
          InstanceId: {
            type: 'String',
            default: instanceId,
            description: 'EC2 instance ID of the Power BI gateway instance'
          },
          TargetVolumeSizeGiB: {
            type: 'String',
            default: '50',
            description: 'Desired minimum size in GiB for the root EBS volume'
          }
        },
        mainSteps: [
          // 🔹 Step 1: Describe instance to find root volume
          {
            name: 'DescribeInstance',
            action: 'aws:executeAwsApi',
            isEnd: false,
            nextStep: 'ResizeRootVolumeIfNeeded',
            inputs: {
              Service: 'ec2',
              Api: 'DescribeInstances',
              InstanceIds: ['{{ InstanceId }}']
            },
            outputs: [
              {
                Name: 'RootVolumeId',
                Selector:
                  '$.Reservations[0].Instances[0].BlockDeviceMappings[0].Ebs.VolumeId',
                Type: 'String'
              }
            ]
          },
          // 🔹 Step 2: Conditionally resize the root volume
          {
            name: 'ResizeRootVolumeIfNeeded',
            action: 'aws:executeScript',
            isEnd: false,
            nextStep: 'ChangeInstanceState',
            inputs: {
              Runtime: 'python3.11',
              Handler: 'script_handler',
              Script: [
                'import boto3',
                '',
                'def script_handler(events, context):',
                '    volume_id = events["volume_id"]',
                '    target_size = int(events["target_size_gib"])',
                '',
                '    ec2 = boto3.client("ec2")',
                '',
                '    # Get current size',
                '    resp = ec2.describe_volumes(VolumeIds=[volume_id])',
                '    current_size = resp["Volumes"][0]["Size"]',
                '',
                '    # Only grow if smaller than target',
                '    if current_size < target_size:',
                '        ec2.modify_volume(VolumeId=volume_id, Size=target_size)',
                '        return {',
                '            "modified": True,',
                '            "oldSizeGiB": current_size,',
                '            "newSizeGiB": target_size,',
                '        }',
                '',
                '    return {',
                '        "modified": False,',
                '        "oldSizeGiB": current_size,',
                '        "newSizeGiB": current_size,',
                '    }'
              ].join('\n'),
              InputPayload: {
                volume_id: '{{ DescribeInstance.RootVolumeId }}',
                target_size_gib: '{{ TargetVolumeSizeGiB }}'
              }
            }
          },
          {
            name: 'ChangeInstanceState',
            action: 'aws:changeInstanceState',
            nextStep: 'RunCommandOnInstances',
            isEnd: false,
            inputs: {
              DesiredState: 'running',
              InstanceIds: ['{{ InstanceId }}']
            }
          },
          {
            name: 'RunCommandOnInstances',
            action: 'aws:runCommand',
            nextStep: 'Sleep',
            isEnd: false,
            inputs: {
              DocumentName: 'AWS-RunPowerShellScript',
              Parameters: {
                commands: [
                  '# Update EC2 Launch, AWS PV Drivers, VC++ redists, Athena ODBC, and Power BI Gateway',
                  '',
                  'function Create-CustomJson {',
                  '    param (',
                  '        [string]$title,',
                  '        [string]$description',
                  '    )',
                  '    $data = @{',
                  "        version = '1.0'",
                  "        source = 'custom'",
                  '        content = @{',
                  "            textType = 'client-markdown'",
                  '            title = $title',
                  '            description = $description',
                  '        }',
                  '        metadata = @{',
                  '            enableCustomActions = $false',
                  '        }',
                  '    }',
                  '    return $data | ConvertTo-Json -Depth 4',
                  '}',
                  '',
                  '# Ensure C:\\Temp exists',
                  '$downloadPath = "C:\\Temp"',
                  'if (-not (Test-Path $downloadPath)) {',
                  '    New-Item -Path $downloadPath -ItemType Directory | Out-Null',
                  '}',
                  '',
                  '# Force TLS 1.2 or higher',
                  '[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12',
                  '',
                  '# Create a browser-like User-Agent',
                  '$userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"',
                  '$wc = New-Object System.Net.WebClient',
                  '$wc.Headers.Add("User-Agent", $userAgent)',
                  '',
                  `$topicArn = "${alertTopic.topicArn}"`,
                  '',
                  '# -------------------------------',
                  '# 1. Update EC2 Launch v2',
                  '# -------------------------------',
                  'Write-Host "Downloading latest EC2Launch v2 installer..."',
                  '$ec2LaunchInstaller = Join-Path $downloadPath "EC2Launch.msi"',
                  '$wc.DownloadFile("https://s3.amazonaws.com/amazon-ec2launch-v2/windows/amd64/latest/AmazonEC2Launch.msi", "$ec2LaunchInstaller")',
                  '$logFile = "C:\\Temp\\EC2LaunchInstall.log"',
                  '$processEc2Launch = Start-Process msiexec.exe -ArgumentList "/i `"$ec2LaunchInstaller`" /qn /norestart /L*v `"$logFile`"" -Wait -PassThru',
                  'if ($processEc2Launch.ExitCode -ne 0) {',
                  '    $description = "EC2Launch v2 installation failed with exit code $($processEc2Launch.ExitCode)"',
                  '    Write-Host $description',
                  `    $msg = Create-CustomJson -title "${scope.envName} env EC2 update - EC2Launch v2 failed" -description $description`,
                  '    Publish-SNSMessage -TopicArn $topicArn -Message $msg',
                  '}',
                  'Remove-Item -Path $ec2LaunchInstaller -Force -ErrorAction SilentlyContinue',
                  '',
                  '# -------------------------------',
                  '# 2. Update AWS PV Drivers',
                  '# -------------------------------',
                  'Write-Host "Downloading latest AWS PV Driver installer..."',
                  '$pvDriverInstaller = Join-Path $downloadPath "AwsPVDriverSetup.msi"',
                  '$zipPath = Join-Path $downloadPath "AWSPVDriver.zip"',
                  '$installScriptPath = Join-Path $downloadPath "install.ps1" # This script installs the drivers and is created automatically',
                  '$wc.DownloadFile("https://s3.amazonaws.com/ec2-windows-drivers-downloads/AWSPV/Latest/AWSPVDriver.zip", $zipPath)',
                  'Expand-Archive -Path $zipPath -DestinationPath $downloadPath -Force',
                  '$logFilePV = "C:\\Temp\\AWSPVDriverInstall.log"',
                  '$processPvDriver = Start-Process msiexec.exe -ArgumentList "/i `"$pvDriverInstaller`" /qn /norestart /L*v `"$logFilePV`"" -Wait -PassThru',
                  'if ($processPvDriver.ExitCode -ne 0) {',
                  '    $description = "AWS PV Drivers installation failed with exit code $($processPvDriver.ExitCode)"',
                  '    Write-Host $description',
                  `    $msg = Create-CustomJson -title "${scope.envName} env EC2 update - AWS PV Drivers failed" -description $description`,
                  '    Publish-SNSMessage -TopicArn $topicArn -Message $msg',
                  '}',
                  'Remove-Item -Path $pvDriverInstaller -Force -ErrorAction SilentlyContinue',
                  'Remove-Item -Path $zipPath -Force -ErrorAction SilentlyContinue',
                  'Remove-Item -Path $installScriptPath -Force -ErrorAction SilentlyContinue',
                  '',
                  '# -------------------------------',
                  '# 3. Update Microsoft Visual C++ Redistributables',
                  '# -------------------------------',
                  'Write-Host "Downloading latest VC++ redistributables..."',
                  '$vcX64 = Join-Path $downloadPath "vc_redist.x64.exe"',
                  '$vcX86 = Join-Path $downloadPath "vc_redist.x86.exe"',
                  '$wc.DownloadFile("https://aka.ms/vs/17/release/vc_redist.x64.exe", $vcX64)',
                  '$wc.DownloadFile("https://aka.ms/vs/17/release/vc_redist.x86.exe", $vcX86)',
                  '',
                  'Write-Host "Installing VC++ x64 redistributable (repair mode)..."',
                  '$pX64 = Start-Process $vcX64 -ArgumentList "/repair /quiet /norestart" -Wait -PassThru',
                  'if ($pX64.ExitCode -ne 0) {',
                  '    $description = "VC++ x64 installation failed with exit code $($pX64.ExitCode)"',
                  `    $msg = Create-CustomJson -title "${scope.envName} env VC++ x64 failed" -description $description`,
                  '    Publish-SNSMessage -TopicArn $topicArn -Message $msg',
                  '}',
                  '',
                  'Write-Host "Installing VC++ x86 redistributable (repair mode)..."',
                  '$pX86 = Start-Process $vcX86 -ArgumentList "/repair /quiet /norestart" -Wait -PassThru',
                  'if ($pX86.ExitCode -ne 0) {',
                  '    $description = "VC++ x86 installation failed with exit code $($pX86.ExitCode)"',
                  `    $msg = Create-CustomJson -title "${scope.envName} env VC++ x86 failed" -description $description`,
                  '    Publish-SNSMessage -TopicArn $topicArn -Message $msg',
                  '}',
                  'Remove-Item -Path $vcX64 -Force -ErrorAction SilentlyContinue',
                  'Remove-Item -Path $vcX86 -Force -ErrorAction SilentlyContinue',
                  '',
                  '# -------------------------------',
                  '# 4. Update Amazon Athena ODBC (64-bit)',
                  '# -------------------------------',
                  'Write-Host "Downloading Amazon Athena ODBC (64-bit)..."',
                  '$athenaMsi = Join-Path $downloadPath "AmazonAthenaODBC64.msi"',
                  'try {',
                  '    # Prefer the known-good static build URL:',
                  '    Invoke-WebRequest -Uri "https://downloads.athena.us-east-1.amazonaws.com/drivers/ODBC/v2.0.4.0/Windows/AmazonAthenaODBC-2.0.4.0.msi" -OutFile $athenaMsi -UseBasicParsing -Headers @{ "User-Agent" = "Mozilla/5.0" }',
                  '} catch {',
                  '    Write-Host "Static Athena URL failed, retrying legacy endpoint..."',
                  '    Invoke-WebRequest -Uri "https://athena-downloads.s3.amazonaws.com/ODBC/latest/AmazonAthenaODBC64.msi" -OutFile $athenaMsi -UseBasicParsing -Headers @{ "User-Agent" = "Mozilla/5.0" }',
                  '}',
                  'Unblock-File $athenaMsi',
                  '$logFileAthena = "C:\\Temp\\AmazonAthenaODBC64Install.log"',
                  '$pAthena = Start-Process msiexec.exe -ArgumentList "/i `"$athenaMsi`" ALLUSERS=1 REBOOT=ReallySuppress /qn /norestart /L*v `"$logFileAthena`"" -Wait -PassThru',
                  'if ($pAthena.ExitCode -ne 0) {',
                  '    $description = "Athena ODBC installation failed with exit code $($pAthena.ExitCode)"',
                  `    $msg = Create-CustomJson -title "${scope.envName} env Athena ODBC failed" -description $description`,
                  '    Publish-SNSMessage -TopicArn $topicArn -Message $msg',
                  '}',
                  'Remove-Item -Path $athenaMsi -Force -ErrorAction SilentlyContinue',
                  '',
                  '# -------------------------------',
                  '# 5. Power BI Data Gateway — Notify + Download',
                  '# -------------------------------',
                  'Write-Host "Checking Power BI Data Gateway (Notify Only)..."',
                  'function Nz($v,$alt){ if ($null -eq $v -or $v -eq "") { $alt } else { $v } }',
                  'function To-Marketing([string]$v){ if (-not $v) { return $null }; $m=[regex]::Match($v,"([0-9]+)\\.([0-9]+)\\.([0-9]+)"); if($m.Success){ return [version]::new([int]$m.Groups[1].Value,[int]$m.Groups[2].Value,[int]$m.Groups[3].Value) } $null }',
                  '$installedService = $null',
                  'try {',
                  '  $svc = Get-CimInstance Win32_Service -Filter "Name=\'PBIEgwService\'" -ErrorAction SilentlyContinue',
                  '  if ($svc -and $svc.PathName) {',
                  "    $exe = ($svc.PathName -replace '^\"?(.+?\\.exe)\"?.*$', '$1')",
                  '    if (Test-Path $exe) { $installedService = (Get-Item $exe).VersionInfo.ProductVersion }',
                  '  }',
                  '} catch {}',
                  '$installedMarketing = $null',
                  '$keys = @("HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall","HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall")',
                  'foreach ($k in $keys) {',
                  '  $hit = Get-ChildItem $k -ErrorAction SilentlyContinue |',
                  '    ForEach-Object { try { Get-ItemProperty $_.PSPath } catch {} } |',
                  '    Where-Object { $_.DisplayName -like "*On-premises data gateway*" -or $_.DisplayName -like "*Power BI Data Gateway*" } |',
                  '    Select-Object -First 1',
                  '  if ($hit) { $installedMarketing = $hit.DisplayVersion; break }',
                  '}',
                  '$gwPath = Join-Path $downloadPath "GatewayInstaller.exe"',
                  'try { Invoke-WebRequest -Uri "https://go.microsoft.com/fwlink/?LinkID=820925" -OutFile $gwPath -UseBasicParsing -Headers @{ "User-Agent" = $userAgent } } catch { $gwPath = $null }',
                  '$instProduct = $null; $instFile = $null',
                  'if ($gwPath -and (Test-Path $gwPath)) {',
                  '  try { $vi = (Get-Item $gwPath).VersionInfo; $instProduct = $vi.ProductVersion; $instFile = $vi.FileVersion } catch {}',
                  '}',
                  '$msUrl = "https://www.microsoft.com/en-us/download/details.aspx?id=53127"',
                  '$latestMarketing = $null',
                  'try {',
                  '  Add-Type -AssemblyName System.Net.Http',
                  '  $h = New-Object System.Net.Http.HttpClientHandler; $h.AllowAutoRedirect = $true',
                  '  $c = [System.Net.Http.HttpClient]::new($h)',
                  '  $c.DefaultRequestHeaders.Add("User-Agent",$userAgent)',
                  '  $c.DefaultRequestHeaders.Add("Accept","text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")',
                  '  $c.DefaultRequestHeaders.Add("Accept-Language","en-US,en;q=0.9")',
                  '  $c.DefaultRequestHeaders.Add("Cache-Control","no-cache")',
                  '  $html = $c.GetStringAsync($msUrl).Result',
                  '  $m = [regex]::Match($html,"`"version`"\\s*:\\s*`"([0-9]+\\.[0-9]+\\.[0-9]+)`"")',
                  '  if (-not $m.Success) { $m = [regex]::Match($html,"Version:\\s*([0-9]+\\.[0-9]+\\.[0-9]+)") }',
                  '  if ($m.Success) { $latestMarketing = $m.Groups[1].Value }',
                  '} catch {}',
                  '$vInstalled = To-Marketing (Nz $installedMarketing $installedService)',
                  '$vLatest    = To-Marketing $latestMarketing',
                  '$status = "UNKNOWN"',
                  'if (-not $vInstalled -and $vLatest) {',
                  '  $status = "NOT-INSTALLED"',
                  '} elseif ($vInstalled -and $vLatest) {',
                  '  if     ($vLatest -gt $vInstalled) { $status = "UPDATE-REQUIRED" }',
                  '  elseif ($vLatest -eq $vInstalled) { $status = "UP-TO-DATE" }',
                  '  else                              { $status = "NEWER-THAN-PAGE" }',
                  '}',
                  '$lines = @(',
                  '  "=== Power BI Gateway Version Check ===",',
                  '  ("Installed (service, marketing): {0}" -f (Nz ($installedMarketing) (Nz $installedService "not found"))),',
                  '  ("Latest (MS page, marketing):    {0}" -f (Nz $latestMarketing "unknown")) ,',
                  '  ("Installer ProductVersion:       {0}" -f (Nz $instProduct "unknown")),',
                  '  ("Installer FileVersion:          {0}" -f (Nz $instFile "unknown")),',
                  '  ("Status:                         {0}" -f $status),',
                  '  ("Download path (if any):         {0}" -f (Nz $downloadedFile "not downloaded")),',
                  '  ("Computer:                       {0}" -f $env:COMPUTERNAME),',
                  '  ("Source:                         {0}" -f $msUrl),',
                  '  "======================================"',
                  ')',
                  '$lines | ForEach-Object { Write-Host $_ }',
                  'if ($status -eq "UPDATE-REQUIRED") {',
                  '  $desc = $lines -join "`n"',
                  `  $msg  = Create-CustomJson -title "${scope.envName} env: Power BI Gateway update required" -description $desc`,
                  '  try { Publish-SNSMessage -TopicArn $topicArn -Message $msg } catch { Write-Warning ("SNS publish failed: " + $_.Exception.Message) }',
                  '}',
                  'Remove-Item -Path $gwPath -Force -ErrorAction SilentlyContinue'
                ]
              },
              InstanceIds: ['{{ InstanceId }}']
            }
          },
          {
            name: 'Sleep',
            action: 'aws:sleep',
            nextStep: 'ChangeInstanceState_1',
            isEnd: false,
            inputs: {
              Duration: 'PT5H' // longer sleep time to allow patch manager and SSM agent update to run
            }
          },
          {
            name: 'ChangeInstanceState_1',
            action: 'aws:changeInstanceState',
            isEnd: true,
            inputs: {
              DesiredState: 'stopped',
              InstanceIds: ['{{ InstanceId }}']
            }
          }
        ]
      }
    }
  );

  // 1st Monday of each month at 3:00 am UTC for non-PROD envs, 3rd Monday of the month for PROD
  const cronSchedule =
    envType === EnvType.PROD
      ? 'cron(0 3 ? * MON#3 *)'
      : 'cron(0 3 ? * MON#1 *)';

  const automationAssociation = new CfnAssociation(
    scope,
    'runbook-monthly-association',
    {
      name: automationRunbook.ref,
      associationName: `monthly-${scope.envName}-update-power-bi-instance-association`,
      scheduleExpression: cronSchedule,
      applyOnlyAtCronInterval: true
    }
  );

  // 🔔 Alert if the association itself fails to run
  new Rule(scope, 'runbook-association-failure-rule', {
    eventPattern: {
      source: ['aws.ssm'],
      detailType: ['EC2 State Manager Association State Change'],
      detail: {
        'association-id': [automationAssociation.ref],
        status: ['Failed']
      }
    },
    targets: [new SnsTopic(alertTopic, { role: alertSnsRole })],
    description: 'Notify if monthly runbook association fails to run'
  });
}

function createPreUpdateSnapshotsWithDlm(
  scope: NhcReportingStack,
  envType: string
): void {
  const cron =
    envType === EnvType.PROD
      ? 'cron(0 3 ? * SUN#4 *)' // Prod: 4th Sunday (day before Monday updates)
      : 'cron(0 3 ? * SUN#2 *)'; // Test: 2nd Sunday

  // DLM service role
  const dlmRole = new Role(scope, 'dlm-service-role', {
    assumedBy: new ServicePrincipal('dlm.amazonaws.com'),
    roleName: `${scope.envName}-nhc-dlm-service-role`,
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSDataLifecycleManagerServiceRole'
      )
    ]
  });

  new CfnLifecyclePolicy(scope, 'preupdate-dlm-policy', {
    description: `Pre-update snapshots for ${scope.envName} BI EC2`,
    state: 'ENABLED',
    executionRoleArn: dlmRole.roleArn,
    policyDetails: {
      resourceTypes: ['INSTANCE'],
      targetTags: [{ key: 'PreUpdateSnapshot', value: scope.envName }],
      schedules: [
        {
          name: `${scope.envName}-preupdate`,
          tagsToAdd: [
            { key: 'Purpose', value: 'PreUpdate' },
            { key: 'Env', value: scope.envName }
          ],
          createRule: { cronExpression: cron },
          retainRule: { count: 2 }
        }
      ]
    }
  });
}
