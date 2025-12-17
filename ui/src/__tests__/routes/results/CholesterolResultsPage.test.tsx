import { render, screen } from '@testing-library/react';
import CholesterolResultsPage from '../../../routes/results/CholesterolResultsPage';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import {
  AuditEventType,
  DiabetesCategory,
  HdlCholesterolCategory,
  type IBiometricScores,
  type ICholesterolScore,
  type IDiabetesScore,
  OverallCholesterolCategory,
  OverallDiabetesCategory,
  TotalCholesterolCategory,
  TotalCholesterolHdlRatioCategory,
  Sex,
  PatientResultsDetailedOpenedPage
} from '@dnhc-health-checks/shared';
import { useHealthCheck } from '../../../hooks/healthCheckHooks';

jest.mock('../../../hooks/healthCheckHooks');
const mockTriggerAuditEvent = jest.fn();

jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

afterEach(() => {
  mockTriggerAuditEvent.mockReset();
});

function getHealthCheckData(biometricScores: IBiometricScores, sex: Sex) {
  return {
    id: '12345',
    dataModelVersion: '2.3.4',
    questionnaire: { sex },
    biometricScores: [biometricScores]
  };
}

function setHealthCheckData(biometricScores: IBiometricScores, sex: Sex) {
  (useHealthCheck as jest.Mock).mockReturnValue({
    data: getHealthCheckData(biometricScores, sex),
    isSuccess: true,
    isPending: false,
    isError: false
  });
}

const diabetes: IDiabetesScore = {
  category: DiabetesCategory.Low,
  overallCategory: OverallDiabetesCategory.Low,
  hba1c: 1
};

const cholesterolScoreNormal: ICholesterolScore = {
  overallCategory: OverallCholesterolCategory.Normal,
  totalCholesterol: 4,
  totalCholesterolCategory: TotalCholesterolCategory.High,
  hdlCholesterol: 3,
  hdlCholesterolCategory: HdlCholesterolCategory.Normal,
  totalCholesterolHdlRatio: 4,
  totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.Normal
};

const cholesterolScoreAtRiskUseCaseOne: ICholesterolScore = {
  overallCategory: OverallCholesterolCategory.AtRisk,
  totalCholesterol: 2.9,
  totalCholesterolCategory: TotalCholesterolCategory.Normal,
  hdlCholesterol: 0.83,
  hdlCholesterolCategory: HdlCholesterolCategory.Low,
  totalCholesterolHdlRatio: 3.7,
  totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.Normal
};

const cholesterolScoreHighRiskUseCaseOne: ICholesterolScore = {
  overallCategory: OverallCholesterolCategory.High,
  totalCholesterol: 6.5,
  totalCholesterolCategory: TotalCholesterolCategory.High,
  hdlCholesterol: 0.5,
  hdlCholesterolCategory: HdlCholesterolCategory.Low,
  totalCholesterolHdlRatio: 6.6,
  totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.High
};

const cholesterolScoreVeryHighRiskUseCaseOne: ICholesterolScore = {
  overallCategory: OverallCholesterolCategory.VeryHigh,
  totalCholesterol: 7.7,
  totalCholesterolCategory: TotalCholesterolCategory.High,
  hdlCholesterol: 0.15,
  hdlCholesterolCategory: HdlCholesterolCategory.Low,
  totalCholesterolHdlRatio: 7.2,
  totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.High
};

const cholesterolScoreVeryHighRiskUseCaseTwo: ICholesterolScore = {
  overallCategory: OverallCholesterolCategory.VeryHigh,
  totalCholesterol: 7.7,
  totalCholesterolCategory: TotalCholesterolCategory.VeryHigh,
  hdlCholesterol: 1.3,
  hdlCholesterolCategory: HdlCholesterolCategory.Normal,
  totalCholesterolHdlRatio: 5.6,
  totalCholesterolHdlRatioCategory: TotalCholesterolHdlRatioCategory.Normal
};

const cholesterolResultsHeading = 'Cholesterol results';
const normalHeading = 'Healthy';
const atRiskHeading = 'At risk';
const highRiskHeading = 'High risk';
const veryHighRiskHeading = 'Very high risk';
const whatYourCholesterolLevelsMean = 'What your cholesterol levels mean';
const useFulResourcesHeading = 'Useful resources';
const howToImproveYourLevels = 'How to improve your levels';
const speakToGP = 'Speak to a GP if:';
const totalCholesterolHdlRatioHeading =
  'A ratio higher than 6 is high risk. The lower the score the better.';

const totalCholesterolBelowFiveHeading =
  'A total cholesterol score of 5mmol/L or below is considered healthy.';

const howToMaintainLevelsHeading = 'How to maintain your levels';

describe('CholesterolResultsPage tests', () => {
  describe('Cholesterol Sub Pages tests', () => {
    test.each([
      {
        cholesterolScore: cholesterolScoreNormal,
        headings: [
          cholesterolResultsHeading,
          normalHeading,
          whatYourCholesterolLevelsMean,
          useFulResourcesHeading,
          totalCholesterolBelowFiveHeading,
          `A level above 1.2mmol/L is considered healthy.`,
          totalCholesterolHdlRatioHeading,
          howToMaintainLevelsHeading
        ]
      },
      {
        cholesterolScore: cholesterolScoreAtRiskUseCaseOne,
        headings: [atRiskHeading, howToImproveYourLevels]
      },
      {
        cholesterolScore: cholesterolScoreHighRiskUseCaseOne,
        headings: [highRiskHeading, speakToGP, howToImproveYourLevels]
      },
      {
        cholesterolScore: cholesterolScoreVeryHighRiskUseCaseOne,
        headings: [
          veryHighRiskHeading,
          speakToGP,
          'You have too much bad cholesterol which blocks your arteries, and not enough good cholesterol to clear it out.',
          howToImproveYourLevels
        ]
      },
      {
        cholesterolScore: cholesterolScoreVeryHighRiskUseCaseTwo,
        headings: [
          'You have too much bad cholesterol and fats in your blood, which can block your arteries.'
        ]
      }
    ])(`Cholesterol results pages}`, ({ cholesterolScore, headings }) => {
      const biometricScores: IBiometricScores = {
        date: '2025-02-11T08:41:24.256Z',
        scores: {
          diabetes,
          cholesterol: cholesterolScore
        }
      };

      setHealthCheckData(biometricScores, Sex.Female);
      const history = createMemoryHistory();
      render(
        <Router location={history.location} navigator={history}>
          <CholesterolResultsPage />
        </Router>
      );

      for (const heading of headings) {
        expect(screen.getByText(heading)).toBeInTheDocument();
      }

      expect(
        screen.getByText(`${cholesterolScore.totalCholesterol}mmol/L`)
      ).toBeInTheDocument();
      expect(
        screen.getByText(`${cholesterolScore.hdlCholesterol}mmol/L`)
      ).toBeInTheDocument();

      expect(
        screen.getByText(`${cholesterolScore.totalCholesterolHdlRatio}`)
      ).toBeInTheDocument();
    });
  });

  it(`send '${AuditEventType.PatientResultsDetailedOpened}' event when page is rendered`, () => {
    const history = createMemoryHistory();
    render(
      <Router location={history.location} navigator={history}>
        <CholesterolResultsPage />
      </Router>
    );

    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      details: { page: PatientResultsDetailedOpenedPage.Cholesterol },
      healthCheck: expect.objectContaining({
        id: '12345',
        dataModelVersion: '2.3.4'
      })
    });
  });
});
