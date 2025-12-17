import { Card } from 'nhsuk-react-components';
import { Link, useNavigate } from 'react-router-dom';
import PageLayout from '../../layouts/PageLayout';
import { RoutePath } from '../../lib/models/route-paths';
import { useHealthCheck } from '../../hooks/healthCheckHooks';
import { Redirecting } from '../../lib/pages/redirecting';
import { mapToEnum } from '../../lib/converters/enum-converter';
import { useEffect, useState } from 'react';
import { useAuditEvent } from '../../hooks/eventAuditHook';
import { RiskCalculationResults } from './main-results-page/RiskCalculationResults';
import {
  AuditEventType,
  type IScores,
  OverallCholesterolCategory,
  OverallDiabetesCategory,
  type BloodPressureCategory,
  QRiskCategory,
  type IHealthCheck,
  SmokingCategory
} from '@dnhc-health-checks/shared';
import { RiskLevelColor } from '../../lib/models/RiskLevelColor';
import { GiveFeedbackSection } from '../../lib/components/give-feedback-section';
import { Spinner } from '../../lib/pages/spinner';
import { cardsConfig, type ResultCardConfig } from './ResultCardConfigs';
import { getLatestBiometricScores } from '../../services/biometrics-score-service';
import ResultCard from './main-results-page/ResultCard';
import MissingResultCard from './main-results-page/MissingResultCard';
import { ImportantCallout } from '../../lib/components/important-callout';
import patientInfoService, {
  type IPatientInfo
} from '../../services/patient-info-service';
import { useQueryClient } from '@tanstack/react-query';
import { DefaultHttpClientErrorHandler } from '../../lib/http/http-client-error-handler';
import { ToDoNextFullResults } from './main-results-page/ToDoNext';

export default function MainResultsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { triggerAuditEvent } = useAuditEvent();
  const healthCheck = useHealthCheck();
  const [patientInfo, setPatientInfo] = useState<IPatientInfo>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response =
          await patientInfoService.getCachedOrFetchPatientInfo(queryClient);
        setPatientInfo(response);
      } catch (error) {
        void new DefaultHttpClientErrorHandler(navigate).handle(
          error,
          healthCheck.data
        );
      }
    };
    void fetchData();
  }, [queryClient, navigate]);

  useEffect(() => {
    void triggerAuditEvent({
      eventType: AuditEventType.PatientResultsSummaryOpened,
      healthCheck: healthCheck.data
    });
  }, [healthCheck.data, triggerAuditEvent]);

  if (healthCheck.isPending) {
    return <Spinner />;
  }
  if (healthCheck.isError) {
    return <Redirecting />;
  }

  const biometricScores = getLatestBiometricScores(healthCheck.data);
  const containsMissingResults =
    (biometricScores?.cholesterol?.overallCategory !== undefined &&
      [
        OverallCholesterolCategory.CompleteFailure,
        OverallCholesterolCategory.PartialFailure
      ].includes(biometricScores.cholesterol.overallCategory)) ||
    biometricScores?.diabetes?.overallCategory ===
      OverallDiabetesCategory.CompleteFailure;
  return (
    <PageLayout displayNhsAppServicesBackButton={true}>
      <h1 className="nhsuk-heading-xl nhsuk-u-margin-bottom-5">
        Hello {patientInfo?.firstName}, here are your results
      </h1>
      <div>
        <RiskCalculationResults
          healthCheck={healthCheck.data as IHealthCheck}
          biometricScores={biometricScores}
        />

        {containsMissingResults &&
          renderMissingResults(
            healthCheck.data as IHealthCheck,
            biometricScores
          )}
        {renderCompletedResults(
          healthCheck.data as IHealthCheck,
          biometricScores
        )}

        <Card>
          <Card.Content>
            <Card.Heading
              id="dementia-heading"
              aria-labelledby="dementia-heading screen-reader-text-separator"
            >
              Your heart and dementia
            </Card.Heading>
            <Card.Description>
              <p>
                A healthy heart supports strong blood flow to the brain,
                lowering the risk of getting dementia.
              </p>
              <p>
                <Card.Link asElement={Link} to={RoutePath.DementiaPage}>
                  Find out how to lower your risk of getting dementia
                </Card.Link>
              </p>
            </Card.Description>
          </Card.Content>
        </Card>
      </div>
      <GiveFeedbackSection
        healthCheck={healthCheck.data}
        patientId={healthCheck.data?.patientId}
      />
    </PageLayout>
  );
}

function renderMissingResults(
  healthCheck: IHealthCheck,
  biometricScores: IScores
) {
  const cholesterolCompletelyFailed =
    biometricScores?.cholesterol?.overallCategory ===
    OverallCholesterolCategory.CompleteFailure;
  const cholesterolPartiallyFailed =
    biometricScores?.cholesterol?.overallCategory ===
    OverallCholesterolCategory.PartialFailure;
  const diabetesFailed =
    biometricScores?.diabetes?.overallCategory ===
    OverallDiabetesCategory.CompleteFailure;
  const cholesterolAndDiabetesFailed =
    diabetesFailed &&
    (cholesterolCompletelyFailed || cholesterolPartiallyFailed);
  const diabetesOnlyFailed =
    diabetesFailed &&
    !(cholesterolCompletelyFailed || cholesterolPartiallyFailed);
  const lowRisk =
    diabetesOnlyFailed &&
    healthCheck.riskScores?.qRiskScoreCategory === QRiskCategory.Low;
  return (
    <>
      <h2>Incomplete result{cholesterolAndDiabetesFailed ? 's' : ''}</h2>
      {!diabetesOnlyFailed && (
        <p>These are the results we could not get from your blood sample.</p>
      )}
      <div id="missing-results">
        {cholesterolCompletelyFailed && (
          <MissingResultCard
            dataTestId="missing-results-cholesterol"
            title={'Cholesterol - no results'}
            paragraphs={[
              'We need to know more about your cholesterol to work out your risk of heart attack or stroke in the next 10 years.'
            ]}
          />
        )}
        {cholesterolPartiallyFailed && (
          <MissingResultCard
            dataTestId="missing-results-cholesterol"
            title={'Cholesterol - some results available'}
            paragraphs={[
              'We need to know more about your cholesterol to work out your risk of heart attack or stroke in the next 10 years.'
            ]}
          >
            <p>
              <Card.Link asElement={Link} to={RoutePath.CholesterolResultsPage}>
                Check your partial cholesterol results
              </Card.Link>
            </p>
          </MissingResultCard>
        )}
        {cholesterolAndDiabetesFailed && (
          <MissingResultCard
            dataTestId="missing-results-diabetes"
            title={'Diabetes screen (HbA1c) - no results'}
            paragraphs={[
              'Based on some of your answers in the health questionnaire, we recommend you get another diabetes screen to get a fuller picture of your health.'
            ]}
          />
        )}
        {diabetesOnlyFailed && (
          <>
            <ImportantCallout>
              <p>
                Based on some of your answers to the health questions, you may
                be at risk of developing type 2 diabetes.
              </p>
              <p>
                We check this by doing a blood test. Unfortunately, there was an
                issue processing your first blood test at the lab (the issue is
                not to do with your health).
              </p>
              <p>You need to contact your GP surgery for another blood test.</p>
            </ImportantCallout>

            {lowRisk ? (
              <Card cardType="non-urgent">
                <Card.Heading>Speak to your GP surgery to:</Card.Heading>
                <Card.Content>
                  <ul>
                    <li>ask for another blood test to screen for diabetes</li>
                  </ul>
                  <p>
                    After your blood test, a healthcare professional will
                    provide any guidance you may need.
                  </p>
                </Card.Content>
              </Card>
            ) : (
              <ToDoNextFullResults healthCheck={healthCheck} />
            )}
          </>
        )}
      </div>
    </>
  );
}

function renderCompletedResults(
  healthCheck: IHealthCheck,
  biometricScores: IScores
) {
  const { toImproveRed, toImproveYellow, keepItUpGreen, keepItUpYellow } =
    sortResultCards(healthCheck, biometricScores);

  return (
    <>
      {(toImproveRed.length > 0 || toImproveYellow.length > 0) && (
        <>
          <h3>Things to improve</h3>
          <Card.Group>
            {mapResultCards(toImproveRed)}
            {mapResultCards(toImproveYellow)}
          </Card.Group>
        </>
      )}

      {(keepItUpGreen.length > 0 || keepItUpYellow.length > 0) && (
        <>
          <h3>Continue what you&apos;re doing</h3>
          <Card.Group>
            {mapResultCards(keepItUpGreen)}
            {mapResultCards(keepItUpYellow)}
          </Card.Group>
        </>
      )}
    </>
  );
}

type ResultCardItem = {
  cardConfig: ResultCardConfig;
  result: string | undefined;
  resultDetail: string | undefined;
  trafficLightValue: string;
};

function mapResultCards(cards: ResultCardItem[]) {
  return cards.map((card) => <ResultCard key={card.cardConfig.id} {...card} />);
}

function sortResultCards(
  healthCheck: IHealthCheck,
  biometricScores: IScores
): {
  toImproveRed: ResultCardItem[];
  toImproveYellow: ResultCardItem[];
  keepItUpGreen: ResultCardItem[];
  keepItUpYellow: ResultCardItem[];
} {
  // cards ordered alphabetically
  const cards: ResultCardItem[] = [
    {
      cardConfig: cardsConfig.Alcohol,
      result: String(healthCheck.questionnaireScores?.auditScore),
      resultDetail: String(healthCheck.questionnaireScores?.auditCategory),
      trafficLightValue: String(healthCheck.questionnaireScores?.auditCategory)
    },

    {
      cardConfig: cardsConfig.BloodPressure,
      result:
        String(healthCheck.questionnaire.bloodPressureSystolic) +
        '/' +
        String(healthCheck.questionnaire.bloodPressureDiastolic),
      resultDetail: String(
        mapToEnum<BloodPressureCategory>(
          String(healthCheck.questionnaireScores?.bloodPressureCategory)
        )
      ),
      trafficLightValue: String(
        mapToEnum<BloodPressureCategory>(
          String(healthCheck.questionnaireScores?.bloodPressureCategory)
        )
      )
    },
    {
      cardConfig: cardsConfig.BMI,
      result: String(healthCheck.questionnaireScores?.bmiScore),
      resultDetail: String(healthCheck.questionnaireScores?.bmiClassification),
      trafficLightValue: String(
        healthCheck.questionnaireScores?.bmiClassification
      )
    },
    ...(biometricScores.cholesterol?.overallCategory === undefined ||
    ![
      OverallCholesterolCategory.CompleteFailure,
      OverallCholesterolCategory.PartialFailure
    ].includes(biometricScores.cholesterol?.overallCategory)
      ? [
          {
            cardConfig: cardsConfig.Cholesterol,
            result: `${String(biometricScores.cholesterol?.totalCholesterol)}mmol/L`,
            resultDetail: String(biometricScores.cholesterol?.overallCategory),
            trafficLightValue: String(
              biometricScores.cholesterol?.overallCategory
            )
          }
        ]
      : []),
    ...(biometricScores.diabetes?.overallCategory !==
    OverallDiabetesCategory.CompleteFailure
      ? [
          {
            cardConfig: cardsConfig.Diabetes,
            result: biometricScores.diabetes?.hba1c
              ? `${String(biometricScores.diabetes?.hba1c)}mmol/mol`
              : undefined,
            resultDetail: String(biometricScores.diabetes?.overallCategory),
            trafficLightValue: String(biometricScores.diabetes?.overallCategory)
          }
        ]
      : []),

    {
      cardConfig: cardsConfig.PhysicalActivity,
      result: undefined,
      resultDetail: String(healthCheck.questionnaireScores?.activityCategory),
      trafficLightValue: String(
        healthCheck.questionnaireScores?.activityCategory
      )
    },
    {
      cardConfig: cardsConfig.Smoking,
      result: String(healthCheck.questionnaire.smoking),
      resultDetail: undefined,
      trafficLightValue: String(
        healthCheck.questionnaireScores?.smokingCategory
      )
    }
  ];

  const toImproveRed: ResultCardItem[] = [];
  const toImproveYellow: ResultCardItem[] = [];
  const keepItUpGreen: ResultCardItem[] = [];
  const keepItUpYellow: ResultCardItem[] = [];

  for (const card of cards) {
    // unique scenario for ex-smoker
    if (card.trafficLightValue === String(SmokingCategory.ExSmoker)) {
      keepItUpYellow.push(card);
      continue;
    }

    if (
      card.cardConfig.getTrafficLight(card.trafficLightValue) ===
      RiskLevelColor.Red
    ) {
      toImproveRed.push(card);
    } else if (
      card.cardConfig.getTrafficLight(card.trafficLightValue) ===
      RiskLevelColor.Yellow
    ) {
      toImproveYellow.push(card);
    } else {
      keepItUpGreen.push(card);
    }
  }

  return { toImproveRed, toImproveYellow, keepItUpGreen, keepItUpYellow };
}
