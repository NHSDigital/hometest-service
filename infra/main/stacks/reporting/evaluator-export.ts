import { type Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import {
  Role,
  ServicePrincipal,
  PolicyStatement,
  ManagedPolicy,
  Effect
} from 'aws-cdk-lib/aws-iam';
import { CfnDocument } from 'aws-cdk-lib/aws-ssm';
import {
  type NhcReportingStack,
  type NhcReportingStackProps
} from './nhc-reporting-stack';
import { NhcBucketFactory } from '../../../common/nhc-bucket-factory';
import { type IKey } from 'aws-cdk-lib/aws-kms';
import * as path from 'path';
import * as fs from 'fs';
import { CfnWorkGroup } from 'aws-cdk-lib/aws-athena';

export function createEvaluationExport({
  scope,
  props,
  databaseName,
  kmsKey
}: {
  scope: NhcReportingStack;
  props: NhcReportingStackProps;
  databaseName: string;
  kmsKey: IKey;
}): { exportBucket: Bucket; workgroup: CfnWorkGroup } {
  const exportBucket = new NhcBucketFactory().create({
    scope,
    id: 'evaluators-export-bucket',
    bucketName: `${scope.account}-${scope.envName}-nhc-evaluator-data-export`,
    accessLoggingBucketName: props.envVariables.aws.accessLoggingBucketName,
    envType: props.envVariables.envType,
    accountNumber: scope.account,
    removalPolicy: props.envVariables.aws.removalPolicy,
    currentVersionExpirationDays:
      props.envVariables.evaluatorExportConfig.fileRetentionDays,
    nonCurrentVersionExpirationDays:
      props.envVariables.evaluatorExportConfig.fileRetentionDays,
    additionalProps: {
      encryption: BucketEncryption.KMS,
      encryptionKey: kmsKey
    }
  });

  const athenaWorkgroupName = `${scope.account}-${scope.envName}-evaluator-export`;
  const workgroup = new CfnWorkGroup(
    scope,
    'athena-evaluator-export-workgroup',
    {
      name: athenaWorkgroupName,
      description: 'Athena workgroup for Evaluator export workflow',
      workGroupConfiguration: {
        enforceWorkGroupConfiguration: false,
        resultConfiguration: {
          outputLocation: `s3://${exportBucket.bucketName}/`,
          encryptionConfiguration: {
            encryptionOption: 'SSE_KMS',
            kmsKey: kmsKey.keyArn
          }
        }
      },
      recursiveDeleteOption: true
    }
  );

  const athenaViews = scope.createFlattenedViewQueries(props, workgroup);

  createRunbook({
    scope,
    flattenedHealthCheckViewName: athenaViews.flattenedHealthCheckViewName,
    flattenedBiometricScoreViewName:
      athenaViews.flattenedBiometricScoreViewName,
    flattenedAuditEventViewName: athenaViews.flattenedAuditEventViewName,
    databaseName,
    exportBucket,
    rowLimit: props.envVariables.evaluatorExportConfig.rowLimit,
    deleteServerAfterDays:
      props.envVariables.evaluatorExportConfig.deleteServerAfterDays,
    workgroup
  });

  return {
    exportBucket,
    workgroup
  };
}

function createRunbook({
  scope,
  flattenedHealthCheckViewName,
  flattenedBiometricScoreViewName,
  flattenedAuditEventViewName,
  databaseName,
  exportBucket,
  rowLimit,
  deleteServerAfterDays,
  workgroup
}: {
  scope: NhcReportingStack;
  flattenedHealthCheckViewName: string;
  flattenedBiometricScoreViewName: string;
  flattenedAuditEventViewName: string;
  databaseName: string;
  exportBucket: Bucket;
  rowLimit: number;
  deleteServerAfterDays: number;
  workgroup: CfnWorkGroup;
}): void {
  const goLiveDate = '2025-04-01';

  const evaluatorHealthCheckQuery = loadQuery('evaluator-health-check.sql', {
    databaseName,
    flattenedHealthCheckViewName,
    flattenedBiometricScoreViewName,
    goLiveDate
  });

  const evaluatorAuditEventQuery = loadQuery('evaluator-audit-event.sql', {
    databaseName,
    flattenedAuditEventViewName,
    goLiveDate
  });

  const sftpUserRole = new Role(
    scope,
    `${scope.envName}-evaluator-export-user-role`,
    {
      assumedBy: new ServicePrincipal('transfer.amazonaws.com'),
      roleName: `${scope.envName}-nhc-evaluator-export-user-role`
    }
  );
  sftpUserRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:GetObjectVersion',
        's3:GetObjectTagging',
        's3:ListBucket'
      ],
      resources: [exportBucket.bucketArn, `${exportBucket.bucketArn}/*`]
    })
  );
  sftpUserRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['kms:Decrypt', 'kms:GenerateDataKey*'],
      resources: [
        `arn:aws:kms:eu-west-2:${scope.managementAccountId}:key/${scope.kmsKeyId}`
      ]
    })
  );

  const sftpServerRole = new Role(
    scope,
    `${scope.envName}-evaluator-export-sftp-role`,
    {
      assumedBy: new ServicePrincipal('transfer.amazonaws.com'),
      roleName: `${scope.envName}-nhc-evaluator-export-sftp-role`,
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSTransferLoggingAccess'
        )
      ]
    }
  );

  const schedulerRole = new Role(
    scope,
    `${scope.envName}-evaluator-export-scheduler-role`,
    {
      assumedBy: new ServicePrincipal('scheduler.amazonaws.com'),
      roleName: `${scope.envName}-nhc-evaluator-export-scheduler-role`
    }
  );
  schedulerRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['transfer:DeleteServer'],
      resources: [`arn:aws:transfer:eu-west-2:${scope.account}:server/*`]
    })
  );

  const runbookRole = new Role(scope, `${scope.envName}-runbook-role`, {
    assumedBy: new ServicePrincipal('ssm.amazonaws.com'),
    roleName: `${scope.envName}-nhc-evaluator-export-runbook-role`
  });
  runbookRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'transfer:CreateUser',
        'transfer:CreateServer',
        'transfer:DescribeServer'
      ],
      resources: [`arn:aws:transfer:eu-west-2:${scope.account}:server/*`]
    })
  );
  runbookRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: [sftpUserRole.roleArn, sftpServerRole.roleArn],
      conditions: {
        StringEquals: {
          'iam:PassedToService': 'transfer.amazonaws.com'
        }
      }
    })
  );
  runbookRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: [schedulerRole.roleArn],
      conditions: {
        StringEquals: {
          'iam:PassedToService': 'scheduler.amazonaws.com'
        }
      }
    })
  );
  runbookRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['scheduler:CreateSchedule'],
      resources: [`arn:aws:scheduler:eu-west-2:${scope.account}:schedule/*`]
    })
  );

  scope.addAthenaAndGluePolicies(runbookRole, exportBucket, workgroup.name);

  runbookRole.addToPolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:DeleteObject'],
      resources: [exportBucket.bucketArn, `${exportBucket.bucketArn}/*`]
    })
  );

  new CfnDocument(scope, `${scope.envName}-evaluator-export-runbook`, {
    name: `nhc-${scope.envName}-evaluator-export-runbook`,
    documentType: 'Automation',
    updateMethod: 'NewVersion',
    content: {
      assumeRole: runbookRole.roleArn,
      schemaVersion: '0.3',
      description:
        'This is the evaluator export runbook that creates csv files with health check and audit event data, available for users via SFTP server.',
      parameters: {
        sftpUserName: {
          type: 'String',
          allowedPattern: '[\\w][\\w@.-]{2,99}',
          description: "Name for the SFTP server's user"
        },
        sftpUserPublicKey: {
          type: 'String',
          allowedPattern:
            '\\s*(ssh|ecdsa)-[a-z0-9-]+[ \\t]+(([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{1,3})?(={0,3})?)(\\s*|[ \\t]+[\\S \\t]*\\s*)',
          description: "SSH public key for the SFTP server's user"
        }
      },
      mainSteps: [
        // steps for Health Checks
        {
          name: 'HC_StartQueryExecution',
          action: 'aws:executeAwsApi',
          nextStep: 'HC_WaitOnAWSResourceProperty',
          isEnd: false,
          inputs: {
            QueryString: `${evaluatorHealthCheckQuery} LIMIT ${rowLimit};`,
            WorkGroup: workgroup.name,
            Service: 'athena',
            Api: 'StartQueryExecution',
            ResultConfiguration: {
              OutputLocation: `s3://${exportBucket.bucketName}/health_check`,
              EncryptionConfiguration: {
                EncryptionOption: 'SSE_KMS',
                KmsKey: scope.kmsKey.keyArn
              }
            }
          },
          outputs: [
            {
              Type: 'String',
              Selector: '$.QueryExecutionId',
              Name: 'queryExecutionId'
            }
          ]
        },
        {
          name: 'HC_WaitOnAWSResourceProperty',
          action: 'aws:waitForAwsResourceProperty',
          maxAttempts: 5,
          nextStep: 'HC_GetQueryRuntimeStatistics',
          isEnd: false,
          inputs: {
            Service: 'athena',
            Api: 'GetQueryExecution',
            PropertySelector: '$.QueryExecution.Status.State',
            DesiredValues: ['SUCCEEDED', 'FAILED', 'CANCELLED'],
            QueryExecutionId: '{{ HC_StartQueryExecution.queryExecutionId }}'
          }
        },
        {
          name: 'HC_GetQueryRuntimeStatistics',
          action: 'aws:executeAwsApi',
          nextStep: 'HC_Branch',
          isEnd: false,
          inputs: {
            Service: 'athena',
            Api: 'GetQueryRuntimeStatistics',
            QueryExecutionId: '{{ HC_StartQueryExecution.queryExecutionId }}'
          },
          outputs: [
            {
              Type: 'Integer',
              Selector: '$.QueryRuntimeStatistics.Rows.OutputRows',
              Name: 'outputRowsNumber'
            }
          ]
        },
        {
          name: 'HC_Branch',
          action: 'aws:branch',
          inputs: {
            Choices: [
              {
                NextStep: 'HC_Loop',
                Variable: '{{ HC_GetQueryRuntimeStatistics.outputRowsNumber }}',
                NumericEquals: rowLimit
              }
            ],
            Default: 'AE_StartQueryExecution'
          }
        },
        {
          name: 'HC_Loop',
          action: 'aws:loop',
          nextStep: 'AE_StartQueryExecution',
          isEnd: false,
          inputs: {
            MaxIterations: 100,
            LoopCondition: {
              Variable:
                '{{ HC_GetQueryRuntimeStatistics_Continue.outputRowsNumber }}',
              NumericEquals: rowLimit
            },
            Steps: [
              {
                name: 'HCRunScript',
                action: 'aws:executeScript',
                nextStep: 'HC_StartQueryExecution_Continue',
                isEnd: false,
                inputs: {
                  Runtime: 'python3.11',
                  Handler: 'script_handler',
                  Script: `def script_handler(events, context):\n  offset = int(events["currentIteration"]) * ${rowLimit}\n  return {'offset': str(offset)}`,
                  InputPayload: {
                    currentIteration: '{{ HC_Loop.CurrentIteration }}'
                  }
                },
                outputs: [
                  {
                    Type: 'String',
                    Name: 'offset',
                    Selector: '$.Payload.offset'
                  }
                ]
              },
              {
                name: 'HC_StartQueryExecution_Continue',
                action: 'aws:executeAwsApi',
                nextStep: 'HC_WaitOnAWSResourceProperty_Continue',
                isEnd: false,
                inputs: {
                  ResultConfiguration: {
                    OutputLocation: `s3://${exportBucket.bucketName}/health_check`,
                    EncryptionConfiguration: {
                      EncryptionOption: 'SSE_KMS',
                      KmsKey: scope.kmsKey.keyArn
                    }
                  },
                  WorkGroup: workgroup.name,
                  Service: 'athena',
                  Api: 'StartQueryExecution',
                  QueryString: `${evaluatorHealthCheckQuery} OFFSET {{ HCRunScript.offset }} LIMIT ${rowLimit};`
                },
                outputs: [
                  {
                    Type: 'String',
                    Selector: '$.QueryExecutionId',
                    Name: 'queryExecutionId'
                  }
                ]
              },
              {
                name: 'HC_WaitOnAWSResourceProperty_Continue',
                action: 'aws:waitForAwsResourceProperty',
                maxAttempts: 5,
                nextStep: 'HC_GetQueryRuntimeStatistics_Continue',
                isEnd: false,
                inputs: {
                  Service: 'athena',
                  Api: 'GetQueryExecution',
                  PropertySelector: '$.QueryExecution.Status.State',
                  DesiredValues: ['SUCCEEDED', 'FAILED', 'CANCELLED'],
                  QueryExecutionId:
                    '{{ HC_StartQueryExecution_Continue.queryExecutionId }}'
                }
              },
              {
                name: 'HC_GetQueryRuntimeStatistics_Continue',
                action: 'aws:executeAwsApi',
                isEnd: true,
                inputs: {
                  Service: 'athena',
                  Api: 'GetQueryRuntimeStatistics',
                  QueryExecutionId:
                    '{{ HC_StartQueryExecution_Continue.queryExecutionId }}'
                },
                outputs: [
                  {
                    Type: 'Integer',
                    Selector: '$.QueryRuntimeStatistics.Rows.OutputRows',
                    Name: 'outputRowsNumber'
                  }
                ]
              }
            ]
          }
        },
        // steps for Audit Events
        {
          name: 'AE_StartQueryExecution',
          action: 'aws:executeAwsApi',
          nextStep: 'AE_WaitOnAWSResourceProperty',
          isEnd: false,
          inputs: {
            QueryString: `${evaluatorAuditEventQuery} LIMIT ${rowLimit};`,
            WorkGroup: workgroup.name,
            Service: 'athena',
            Api: 'StartQueryExecution',
            ResultConfiguration: {
              OutputLocation: `s3://${exportBucket.bucketName}/audit_event`,
              EncryptionConfiguration: {
                EncryptionOption: 'SSE_KMS',
                KmsKey: scope.kmsKey.keyArn
              }
            }
          },
          outputs: [
            {
              Type: 'String',
              Selector: '$.QueryExecutionId',
              Name: 'queryExecutionId'
            }
          ]
        },
        {
          name: 'AE_WaitOnAWSResourceProperty',
          action: 'aws:waitForAwsResourceProperty',
          maxAttempts: 5,
          nextStep: 'AE_GetQueryRuntimeStatistics',
          isEnd: false,
          inputs: {
            Service: 'athena',
            Api: 'GetQueryExecution',
            PropertySelector: '$.QueryExecution.Status.State',
            DesiredValues: ['SUCCEEDED', 'FAILED', 'CANCELLED'],
            QueryExecutionId: '{{ AE_StartQueryExecution.queryExecutionId }}'
          }
        },
        {
          name: 'AE_GetQueryRuntimeStatistics',
          action: 'aws:executeAwsApi',
          nextStep: 'AE_Branch',
          isEnd: false,
          inputs: {
            Service: 'athena',
            Api: 'GetQueryRuntimeStatistics',
            QueryExecutionId: '{{ AE_StartQueryExecution.queryExecutionId }}'
          },
          outputs: [
            {
              Type: 'Integer',
              Selector: '$.QueryRuntimeStatistics.Rows.OutputRows',
              Name: 'outputRowsNumber'
            }
          ]
        },
        {
          name: 'AE_Branch',
          action: 'aws:branch',
          inputs: {
            Choices: [
              {
                NextStep: 'AE_Loop',
                Variable: '{{ AE_GetQueryRuntimeStatistics.outputRowsNumber }}',
                NumericEquals: rowLimit
              }
            ],
            Default: 'HC_RenameCsvFiles'
          }
        },
        {
          name: 'AE_Loop',
          action: 'aws:loop',
          nextStep: 'HC_RenameCsvFiles',
          isEnd: false,
          inputs: {
            MaxIterations: 100,
            LoopCondition: {
              Variable:
                '{{ AE_GetQueryRuntimeStatistics_Continue.outputRowsNumber }}',
              NumericEquals: rowLimit
            },
            Steps: [
              {
                name: 'AE_RunScript',
                action: 'aws:executeScript',
                nextStep: 'AE_StartQueryExecution_Continue',
                isEnd: false,
                inputs: {
                  Runtime: 'python3.11',
                  Handler: 'script_handler',
                  Script: `def script_handler(events, context):\n  offset = int(events["currentIteration"]) * ${rowLimit}\n  return {'offset': str(offset)}`,
                  InputPayload: {
                    currentIteration: '{{ AE_Loop.CurrentIteration }}'
                  }
                },
                outputs: [
                  {
                    Type: 'String',
                    Name: 'offset',
                    Selector: '$.Payload.offset'
                  }
                ]
              },
              {
                name: 'AE_StartQueryExecution_Continue',
                action: 'aws:executeAwsApi',
                nextStep: 'AE_WaitOnAWSResourceProperty_Continue',
                isEnd: false,
                inputs: {
                  ResultConfiguration: {
                    OutputLocation: `s3://${exportBucket.bucketName}/audit_event`,
                    EncryptionConfiguration: {
                      EncryptionOption: 'SSE_KMS',
                      KmsKey: scope.kmsKey.keyArn
                    }
                  },
                  WorkGroup: workgroup.name,
                  Service: 'athena',
                  Api: 'StartQueryExecution',
                  QueryString: `${evaluatorAuditEventQuery} OFFSET {{ AE_RunScript.offset }} LIMIT ${rowLimit};`
                },
                outputs: [
                  {
                    Type: 'String',
                    Selector: '$.QueryExecutionId',
                    Name: 'queryExecutionId'
                  }
                ]
              },
              {
                name: 'AE_WaitOnAWSResourceProperty_Continue',
                action: 'aws:waitForAwsResourceProperty',
                maxAttempts: 5,
                nextStep: 'AE_GetQueryRuntimeStatistics_Continue',
                isEnd: false,
                inputs: {
                  Service: 'athena',
                  Api: 'GetQueryExecution',
                  PropertySelector: '$.QueryExecution.Status.State',
                  DesiredValues: ['SUCCEEDED', 'FAILED', 'CANCELLED'],
                  QueryExecutionId:
                    '{{ AE_StartQueryExecution_Continue.queryExecutionId }}'
                }
              },
              {
                name: 'AE_GetQueryRuntimeStatistics_Continue',
                action: 'aws:executeAwsApi',
                isEnd: true,
                inputs: {
                  Service: 'athena',
                  Api: 'GetQueryRuntimeStatistics',
                  QueryExecutionId:
                    '{{ AE_StartQueryExecution_Continue.queryExecutionId }}'
                },
                outputs: [
                  {
                    Type: 'Integer',
                    Selector: '$.QueryRuntimeStatistics.Rows.OutputRows',
                    Name: 'outputRowsNumber'
                  }
                ]
              }
            ]
          }
        },
        {
          name: 'HC_RenameCsvFiles',
          action: 'aws:executeScript',
          nextStep: 'AE_RenameCsvFiles',
          isEnd: false,
          inputs: {
            Script: `import boto3\nfrom datetime import datetime\nfrom zoneinfo import ZoneInfo\n\ndef script_handler(events, context):\n  client = boto3.client('s3')\n  paginator = client.get_paginator('list_objects_v2')\n  page_iterator = paginator.paginate(Bucket='${exportBucket.bucketName}', Prefix='health_check/')\n\n  object_keys = []\n  timestamp = datetime.now(ZoneInfo('Europe/London')).strftime('%Y-%m-%d_%H:%M:%S')\n\n  for page in page_iterator:\n    for object in page['Contents']:\n      object_keys.append(object['Key'])\n\n  for key in object_keys:\n    if key.endswith('.csv'):\n      file_name = key.replace('health_check/', '')\n      client.copy_object(Bucket='${exportBucket.bucketName}', CopySource=f'${exportBucket.bucketName}/{key}', Key=f'HealthCheck_{timestamp}_{file_name}')\n      client.delete_object(Bucket='${exportBucket.bucketName}', Key=key)\n    if key.endswith('.metadata'):\n      client.delete_object(Bucket='${exportBucket.bucketName}', Key=key)\n`,
            Runtime: 'python3.11',
            Handler: 'script_handler'
          }
        },
        {
          name: 'AE_RenameCsvFiles',
          action: 'aws:executeScript',
          nextStep: 'CreateServer',
          isEnd: false,
          inputs: {
            Script: `import boto3\nfrom datetime import datetime\nfrom zoneinfo import ZoneInfo\n\ndef script_handler(events, context):\n  client = boto3.client('s3')\n  paginator = client.get_paginator('list_objects_v2')\n  page_iterator = paginator.paginate(Bucket='${exportBucket.bucketName}', Prefix='audit_event/')\n\n  object_keys = []\n  timestamp = datetime.now(ZoneInfo('Europe/London')).strftime('%Y-%m-%d_%H:%M:%S')\n\n  for page in page_iterator:\n    for object in page['Contents']:\n      object_keys.append(object['Key'])\n\n  for key in object_keys:\n    if key.endswith('.csv'):\n      file_name = key.replace('audit_event/', '')\n      client.copy_object(Bucket='${exportBucket.bucketName}', CopySource=f'${exportBucket.bucketName}/{key}', Key=f'AuditEvent_{timestamp}_{file_name}')\n      client.delete_object(Bucket='${exportBucket.bucketName}', Key=key)\n    if key.endswith('.metadata'):\n      client.delete_object(Bucket='${exportBucket.bucketName}', Key=key)\n`,
            Runtime: 'python3.11',
            Handler: 'script_handler'
          }
        },
        {
          name: 'CreateServer',
          action: 'aws:executeAwsApi',
          nextStep: 'WaitOnAWSResourceProperty_SFTP',
          isEnd: false,
          inputs: {
            Service: 'transfer',
            Api: 'CreateServer',
            EndpointType: 'PUBLIC',
            Protocols: ['SFTP'],
            LoggingRole: sftpServerRole.roleArn
          },
          outputs: [
            {
              Type: 'String',
              Selector: '$.ServerId',
              Name: 'sftpServerId'
            }
          ]
        },
        {
          name: 'WaitOnAWSResourceProperty_SFTP',
          action: 'aws:waitForAwsResourceProperty',
          maxAttempts: 4,
          nextStep: 'CreateUser',
          isEnd: false,
          onFailure: 'Abort',
          inputs: {
            Service: 'transfer',
            Api: 'DescribeServer',
            DesiredValues: ['ONLINE'],
            PropertySelector: '$.Server.State',
            ServerId: '{{ CreateServer.sftpServerId }}'
          }
        },
        {
          name: 'CreateUser',
          action: 'aws:executeAwsApi',
          nextStep: 'GetDeleteScheduleDate',
          isEnd: false,
          inputs: {
            Service: 'transfer',
            Api: 'CreateUser',
            ServerId: '{{ CreateServer.sftpServerId }}',
            UserName: '{{ sftpUserName }}',
            Role: sftpUserRole.roleArn,
            HomeDirectoryType: 'PATH',
            HomeDirectory: `/${exportBucket.bucketName}`,
            SshPublicKeyBody: '{{ sftpUserPublicKey }}'
          }
        },
        {
          name: 'GetDeleteScheduleDate',
          action: 'aws:executeScript',
          nextStep: 'CreateSchedule',
          isEnd: false,
          inputs: {
            Runtime: 'python3.11',
            Handler: 'script_handler',
            Script: `from datetime import datetime, timedelta\n\ndef script_handler(events, context):\n    current_datetime = datetime.now()\n    future_datetime = current_datetime + timedelta(days=${deleteServerAfterDays})\n    formatted_datetime = future_datetime.strftime('%Y-%m-%dT%H:%M:%S')\n    return {'deleteScheduleDateExpression': 'at({0})'.format(formatted_datetime)}`
          },
          outputs: [
            {
              Type: 'String',
              Name: 'deleteScheduleDateExpression',
              Selector: '$.Payload.deleteScheduleDateExpression'
            }
          ]
        },
        {
          name: 'CreateSchedule',
          action: 'aws:executeAwsApi',
          isEnd: true,
          inputs: {
            Service: 'scheduler',
            Api: 'CreateSchedule',
            Name: 'deleteServer_{{ CreateServer.sftpServerId }}',
            FlexibleTimeWindow: {
              Mode: 'OFF'
            },
            ScheduleExpression:
              '{{ GetDeleteScheduleDate.deleteScheduleDateExpression }}',
            ActionAfterCompletion: 'DELETE',
            Target: {
              Arn: 'arn:aws:scheduler:::aws-sdk:transfer:deleteServer',
              RoleArn: schedulerRole.roleArn,
              Input: '{"ServerId": "{{ CreateServer.sftpServerId }}" }'
            }
          }
        }
      ]
    }
  });
}

function loadQuery(
  fileName: string,
  params: Record<string, string | number>
): string {
  const filePath = path.join(__dirname, './sql', fileName);
  const query = fs.readFileSync(filePath, 'utf-8');
  return Object.entries(params).reduce(
    (result, [key, value]) =>
      result.replace(new RegExp(`{{${key}}}`, 'g'), String(value)),
    query
  );
}
