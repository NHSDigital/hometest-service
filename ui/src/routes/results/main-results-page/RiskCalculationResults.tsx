import { Card, Details, InsetText } from 'nhsuk-react-components';
import {
  type IHealthCheck,
  QRiskCategory,
  OverallCholesterolCategory,
  OverallDiabetesCategory,
  type IScores
} from '@dnhc-health-checks/shared';
import { RiskLevelColor } from '../../../lib/models/RiskLevelColor';
import { ToDoNextFullResults } from './ToDoNext';

interface RiskCalcMissingResultsProps {
  diabetesTestOrderedAndFailed: boolean;
  cholesterolPartiallyFailed: boolean;
  healthCheck: IHealthCheck;
}

export function RiskCalculationResults({
  healthCheck,
  biometricScores
}: Readonly<{
  healthCheck: IHealthCheck;
  biometricScores: IScores;
}>) {
  const cholesterolPartiallyFailed =
    biometricScores.cholesterol?.overallCategory ===
    OverallCholesterolCategory.PartialFailure;
  const cholesterolCompletelyFailed =
    biometricScores.cholesterol?.overallCategory ===
    OverallCholesterolCategory.CompleteFailure;
  const diabetesTestOrderedAndFailed =
    biometricScores.diabetes?.overallCategory ===
    OverallDiabetesCategory.CompleteFailure;

  if (cholesterolCompletelyFailed || cholesterolPartiallyFailed) {
    return (
      <RiskCalcMissingResults
        diabetesTestOrderedAndFailed={diabetesTestOrderedAndFailed}
        cholesterolPartiallyFailed={cholesterolPartiallyFailed}
        healthCheck={healthCheck}
      />
    );
  }

  return (
    <RiskCalcFullyAvailableResults
      healthCheck={healthCheck}
      diabetesSuccess={!diabetesTestOrderedAndFailed}
    />
  );
}

function RiskCalcMissingResults({
  diabetesTestOrderedAndFailed,
  cholesterolPartiallyFailed,
  healthCheck
}: Readonly<RiskCalcMissingResultsProps>) {
  let dynamicParagraph =
    'There was an issue processing your blood tests at the lab, so we could not get';
  if (diabetesTestOrderedAndFailed) {
    dynamicParagraph +=
      (cholesterolPartiallyFailed ? ' all ' : ' ') +
      'your results for cholesterol and diabetes.';
  } else {
    dynamicParagraph +=
      (cholesterolPartiallyFailed ? ' all ' : ' ') +
      'your cholesterol results.';
  }

  return (
    <>
      <Card>
        <div>
          <Card.Content>
            <Card.Heading
              id="missing-risk-score-heading"
              aria-labelledby="missing-risk-score-heading"
            >
              We could not work out your risk of heart attack or stroke
            </Card.Heading>
            <p>{dynamicParagraph}</p>
            <p>
              This sometimes happens. It does not mean there&apos;s a problem
              with your health or that you did anything wrong.
            </p>
            <p>
              Your GP surgery can give you another blood test, and they&apos;ll
              work out your risk of heart attack or stroke in the next 10 years.
            </p>
            <RiskCalcIncompleteBloodTestDetails />
          </Card.Content>
        </div>
      </Card>

      <ToDoNextFullResults healthCheck={healthCheck} />
    </>
  );
}

function RiskCalcIncompleteBloodTestDetails({
  pluralizeHeader = true
}: Readonly<{ pluralizeHeader?: boolean }> = {}) {
  return (
    <Details>
      <Details.Summary>
        What happened with my blood test{pluralizeHeader ? 's' : ''}?
      </Details.Summary>
      <Details.Text>
        <p>
          A few things can happen at the lab when processing your blood test
          that mean we could not get all your results.
        </p>
        <p>It could be that:</p>
        <ul>
          <li>not enough blood was collected</li>
          <li>the sample may have been contaminated </li>
          <li>there was a problem transporting the sample</li>
        </ul>
        <p>
          We understand that this can be frustrating. It&apos;s not an
          indication that there&apos;s something wrong with your health, or that
          you did the blood test incorrectly.
        </p>
      </Details.Text>
    </Details>
  );
}

function RiskCalcFullyAvailableResults({
  healthCheck,
  diabetesSuccess
}: Readonly<{
  healthCheck: IHealthCheck;
  diabetesSuccess: boolean;
}>) {
  const qRiskScore = Number(healthCheck.riskScores?.qRiskScore ?? 0);
  const cvdColour = getCVDColor(
    healthCheck.riskScores?.qRiskScoreCategory ?? QRiskCategory.Low
  );
  return (
    <>
      <Card>
        <div className="app-card__hero">
          <Card.Content>
            <Card.Heading
              id="heart-age-heading"
              aria-labelledby="heart-age-heading screen-reader-text-separator heart-age-number"
            >
              Your heart age is:{' '}
              <span
                className="app-card__heading-big-number"
                aria-hidden="true"
                id="heart-age-number"
              >
                {healthCheck.riskScores?.heartAge}
              </span>
            </Card.Heading>
            <p>
              Your age is:{' '}
              <span className="nhsuk-u-font-weight-bold">
                {healthCheck.ageAtCompletion}
              </span>
            </p>
            <InsetText
              className={cvdColour + ' app-card__heading-inset'}
              id="cvd-risk-number"
            >
              <p>
                You&apos;re at{' '}
                {String(
                  healthCheck.riskScores?.qRiskScoreCategory ??
                    QRiskCategory.Low
                ).toLowerCase()}{' '}
                risk of heart attack or stroke in the next 10 years
              </p>
            </InsetText>
            <p>
              Your cardiovascular disease (CVD) risk score is{' '}
              <span className="nhsuk-u-font-weight-bold cvdRiskScoreValue">
                {qRiskScore}%
              </span>
              . That means that out of 100 people with the same risk factors as
              you, {qRiskScore} people are likely to have a heart attack or
              stroke in the next 10 years.
            </p>
            <Details>
              <Details.Summary>How is my score calculated?</Details.Summary>
              <Details.Text>
                <p>We calculate heart age and CVD risk using QRISK3 data.</p>
                <p>
                  QRISK3 looks at risk factors like your blood pressure,
                  cholesterol and if you smoke. It compares you with healthy
                  people who are the same age, sex (at birth) and ethnicity as
                  you.
                </p>
              </Details.Text>
            </Details>
          </Card.Content>
        </div>
      </Card>
      {diabetesSuccess && <ToDoNextFullResults healthCheck={healthCheck} />}
    </>
  );
}

function getCVDColor(category: QRiskCategory): RiskLevelColor {
  if (category === QRiskCategory.High) {
    return RiskLevelColor.Red;
  }
  if (category === QRiskCategory.Moderate) {
    return RiskLevelColor.Yellow;
  }
  return RiskLevelColor.Green;
}
