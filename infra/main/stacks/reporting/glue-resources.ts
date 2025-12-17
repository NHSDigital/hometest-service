import { S3Table, Database, DataFormat, Schema } from '@aws-cdk/aws-glue-alpha';
import { type Construct } from 'constructs';
import { type NhcReportingStackProps } from './nhc-reporting-stack';
import { type Bucket } from 'aws-cdk-lib/aws-s3';
import { Stack } from '../../stack';

export function createGlueResources(
  scope: Construct,
  props: NhcReportingStackProps,
  reportingBucket: Bucket
): { database: Database } {
  const database = new Database(scope, 'BiDatabase', {
    databaseName: `${Stack.REPORTING}-${props.envVariables.common.envName}-bi-db`,
    description: 'Database containing health check and audit tables for BI'
  });

  new S3Table(scope, 'HealthCheckGlueTable', {
    database,
    // Schema should conform to https://nhsd-confluence.digital.nhs.uk/pages/viewpage.action?pageId=869451257#ODP11aReportingandKPIMonitoring(Beta)-DataSets
    columns: [
      {
        name: 'id',
        type: Schema.STRING
      },
      {
        name: 'patientId',
        type: Schema.STRING
      },
      {
        name: 'createdAt',
        type: Schema.STRING
      },
      {
        name: 'ageAtStart',
        type: Schema.INTEGER
      },
      {
        name: 'ageAtCompletion',
        type: Schema.INTEGER
      },
      {
        name: 'questionnaire',
        type: Schema.struct([
          {
            name: 'hasReceivedAnInvitation',
            type: Schema.BOOLEAN
          },
          {
            name: 'hasCompletedHealthCheckInLast5Years',
            type: Schema.BOOLEAN
          },
          {
            name: 'hasPreExistingCondition',
            type: Schema.BOOLEAN
          },
          {
            name: 'canCompleteHealthCheckOnline',
            type: Schema.BOOLEAN
          },
          {
            name: 'hasFamilyHeartAttackHistory',
            type: Schema.STRING
          },
          {
            name: 'hasFamilyDiabetesHistory',
            type: Schema.STRING
          },
          {
            name: 'sex',
            type: Schema.STRING
          },
          {
            name: 'ethnicBackground',
            type: Schema.STRING
          },
          {
            name: 'detailedEthnicGroup',
            type: Schema.STRING
          },
          {
            name: 'drinkAlcohol',
            type: Schema.STRING
          },
          {
            name: 'alcoholHowOften',
            type: Schema.STRING
          },
          {
            name: 'alcoholDailyUnits',
            type: Schema.STRING
          },
          {
            name: 'exerciseHours',
            type: Schema.STRING
          },
          {
            name: 'smoking',
            type: Schema.STRING
          },
          {
            name: 'heightDisplayPreference',
            type: Schema.STRING
          },
          {
            name: 'weightDisplayPreference',
            type: Schema.STRING
          },
          {
            name: 'waistMeasurementDisplayPreference',
            type: Schema.STRING
          },
          {
            name: 'bloodPressureDiastolic',
            type: Schema.INTEGER
          },
          {
            name: 'bloodPressureSystolic',
            type: Schema.INTEGER
          },
          {
            name: 'bloodPressureLocation',
            type: Schema.STRING
          },
          {
            // Historical health checks may have this field
            name: 'healthCheckAccepted',
            type: Schema.BOOLEAN
          },
          {
            name: 'isAboutYouSectionSubmitted',
            type: Schema.BOOLEAN
          },
          {
            name: 'isAlcoholSectionSubmitted',
            type: Schema.BOOLEAN
          },
          {
            name: 'isBloodPressureSectionSubmitted',
            type: Schema.BOOLEAN
          },
          {
            name: 'isBodyMeasurementsSectionSubmitted',
            type: Schema.BOOLEAN
          },
          {
            name: 'isPhysicalActivitySectionSubmitted',
            type: Schema.BOOLEAN
          }
        ])
      },
      {
        name: 'questionnaireScores',
        type: Schema.struct([
          {
            name: 'auditScore',
            type: Schema.INTEGER
          },
          {
            name: 'auditCategory',
            type: Schema.STRING
          },
          {
            name: 'activityCategory',
            type: Schema.STRING
          },
          {
            name: 'gppaqScore',
            type: Schema.INTEGER
          },
          {
            name: 'bmiScore',
            type: Schema.DOUBLE
          },
          {
            name: 'bmiClassification',
            type: Schema.STRING
          },
          {
            name: 'bloodPressureCategory',
            type: Schema.STRING
          },
          {
            name: 'leicesterRiskScore',
            type: Schema.DOUBLE
          },
          {
            name: 'leicesterRiskCategory',
            type: Schema.STRING
          },
          {
            name: 'smokingCategory',
            type: Schema.STRING
          },
          {
            name: 'townsendScore',
            type: Schema.DOUBLE
          },
          {
            name: 'imd',
            type: Schema.struct([
              {
                name: 'score',
                type: Schema.DOUBLE
              },
              {
                name: 'decile',
                type: Schema.INTEGER
              },
              {
                name: 'rank',
                type: Schema.INTEGER
              }
            ])
          }
        ])
      },
      {
        name: 'questionnaireCompletionDate',
        type: Schema.STRING
      },
      {
        name: 'riskScores',
        type: Schema.struct([
          {
            name: 'qRiskScore',
            type: Schema.DOUBLE
          },
          {
            name: 'qRiskScoreCategory',
            type: Schema.STRING
          },
          {
            name: 'scoreCalculationDate',
            type: Schema.STRING
          },
          {
            name: 'heartAge',
            type: Schema.INTEGER
          }
        ])
      },
      {
        name: 'step',
        type: Schema.STRING
      },
      {
        name: 'bloodTestOrder',
        type: Schema.struct([
          {
            name: 'isBloodTestSectionSubmitted',
            type: Schema.BOOLEAN
          }
        ])
      },
      {
        name: 'dataModelVersion',
        type: Schema.STRING
      },
      {
        name: 'wasInvited',
        type: Schema.BOOLEAN
      }
    ],
    dataFormat: DataFormat.JSON,
    bucket: reportingBucket,
    s3Prefix: 'health-checks/',
    tableName: `${Stack.REPORTING}-${props.envVariables.common.envName}-health-check-table`
  });

  new S3Table(scope, 'BiometricScoreGlueTable', {
    database,
    // Schema should conform to https://nhsd-confluence.digital.nhs.uk/pages/viewpage.action?pageId=869451257#ODP11aReportingandKPIMonitoring(Beta)-DataSets
    columns: [
      {
        name: 'id',
        type: Schema.STRING
      },
      {
        name: 'biometricScores',
        type: Schema.array(
          Schema.struct([
            { name: 'date', type: Schema.STRING },
            {
              name: 'scores',
              type: Schema.struct([
                {
                  name: 'diabetes',
                  type: Schema.struct([
                    {
                      name: 'overallCategory',
                      type: Schema.STRING
                    },
                    {
                      name: 'failureReason',
                      type: Schema.STRING
                    },
                    {
                      name: 'category',
                      type: Schema.STRING
                    }
                  ])
                },
                {
                  name: 'cholesterol',
                  type: Schema.struct([
                    {
                      name: 'overallCategory',
                      type: Schema.STRING
                    },
                    {
                      name: 'hdlCholesterolFailureReason',
                      type: Schema.STRING
                    },
                    {
                      name: 'totalCholesterolFailureReason',
                      type: Schema.STRING
                    },
                    {
                      name: 'totalCholesterolHdlRatioFailureReason',
                      type: Schema.STRING
                    },
                    {
                      name: 'hdlCholesterolCategory',
                      type: Schema.STRING
                    },
                    {
                      name: 'totalCholesterolCategory',
                      type: Schema.STRING
                    },
                    {
                      name: 'totalCholesterolHdlRatioCategory',
                      type: Schema.STRING
                    }
                  ])
                }
              ])
            }
          ])
        )
      }
    ],
    dataFormat: DataFormat.JSON,
    bucket: reportingBucket,
    s3Prefix: 'health-checks/',
    tableName: `${Stack.REPORTING}-${props.envVariables.common.envName}-biometric-score-table`
  });

  new S3Table(scope, 'AuditGlueTable', {
    database,
    // Schema should conform to https://nhsd-confluence.digital.nhs.uk/pages/viewpage.action?pageId=869451257#ODP11aReportingandKPIMonitoring(Beta)-DataSets
    columns: [
      {
        name: 'id',
        type: Schema.STRING
      },
      {
        name: 'healthCheckId',
        type: Schema.STRING
      },
      {
        name: 'eventType',
        type: Schema.STRING
      },
      {
        name: 'datetime',
        type: Schema.STRING
      },
      {
        name: 'patientId',
        type: Schema.STRING
      },
      {
        name: 'odsCode',
        type: Schema.STRING
      },
      {
        name: 'source',
        type: Schema.STRING
      },
      {
        name: 'nhcVersion',
        type: Schema.STRING
      },
      {
        name: 'hcDataModelVersion',
        type: Schema.STRING
      },
      {
        name: 'details',
        type: Schema.struct([
          {
            name: 'termsAndConditionsVersion',
            type: Schema.STRING
          },
          {
            name: 'totalResults',
            type: Schema.INTEGER
          },
          {
            name: 'filteredResults',
            type: Schema.INTEGER
          },
          {
            name: 'bpTakenAt',
            type: Schema.STRING
          },
          {
            name: 'writebackType',
            type: Schema.STRING
          },
          {
            name: 'testTypes',
            type: Schema.array(Schema.STRING)
          },
          {
            name: 'reasons',
            type: Schema.array(Schema.STRING)
          },
          {
            name: 'followUp',
            type: Schema.STRING
          },
          {
            name: 'notifyMessageID',
            type: Schema.STRING
          },
          {
            name: 'page',
            type: Schema.STRING
          },
          {
            name: 'healthCheckStep',
            type: Schema.STRING
          },
          {
            name: 'expiryType',
            type: Schema.STRING
          },
          {
            name: 'bpConfirmed',
            type: Schema.STRING
          },
          {
            name: 'bpSymptoms',
            type: Schema.STRING
          },
          {
            name: 'bpRoute',
            type: Schema.STRING
          },
          {
            name: 'openedFrom',
            type: Schema.STRING
          },
          {
            name: 'resourceTitle',
            type: Schema.STRING
          },
          {
            name: 'bloodTestUpdatesMobileEntered',
            type: Schema.BOOLEAN
          },
          {
            name: 'previousDataModelVersion',
            type: Schema.STRING
          },
          {
            name: 'lsoaVersion',
            type: Schema.STRING
          },
          {
            name: 'imdVersion',
            type: Schema.STRING
          },
          {
            name: 'HbA1cStatus',
            type: Schema.STRING
          },
          {
            name: 'cholesterolStatus',
            type: Schema.STRING
          },
          {
            name: 'messageType',
            type: Schema.STRING
          },
          {
            name: 'channel',
            type: Schema.STRING
          },
          {
            name: 'urlSource',
            type: Schema.STRING
          },
          {
            name: 'journeySectionsComplete',
            type: Schema.array(Schema.STRING)
          }
        ])
      }
    ],
    dataFormat: DataFormat.JSON,
    bucket: reportingBucket,
    s3Prefix: 'audit-events/',
    tableName: `${Stack.REPORTING}-${props.envVariables.common.envName}-audit-event-table`
  });

  new S3Table(scope, 'OdsMappingGlueTable', {
    database,
    columns: [
      {
        name: 'odsCode',
        type: Schema.STRING
      },
      {
        name: 'gpPracticeName',
        type: Schema.STRING
      },
      {
        name: 'localAuthority',
        type: Schema.STRING
      }
    ],
    dataFormat: DataFormat.JSON,
    bucket: reportingBucket,
    s3Prefix: 'ods-mapping/',
    tableName: `${Stack.REPORTING}-${props.envVariables.common.envName}-ods-mapping-table`
  });

  return { database };
}
