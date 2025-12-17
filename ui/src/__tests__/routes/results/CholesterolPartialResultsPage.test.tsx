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

function getHealthCheckData(biometricScores: IBiometricScores[], sex: Sex) {
  return {
    id: '12345',
    questionnaire: { sex },
    biometricScores: biometricScores,
    dataModelVersion: '2.3.4'
  };
}

function setHealthCheckData(biometricScores: IBiometricScores[], sex: Sex) {
  (useHealthCheck as jest.Mock).mockReturnValue({
    data: getHealthCheckData(biometricScores, sex),
    isSuccess: true,
    isPending: false,
    isError: false
  });
}

const diabetes: IDiabetesScore = {
  overallCategory: OverallDiabetesCategory.Low,
  category: DiabetesCategory.Low,
  hba1c: 1
};

const partialCholesterolHdlNormal: ICholesterolScore = {
  overallCategory: OverallCholesterolCategory.PartialFailure,
  hdlCholesterol: 1.5,
  hdlCholesterolCategory: HdlCholesterolCategory.Normal,
  totalCholesterol: null,
  totalCholesterolCategory: null,
  totalCholesterolFailureReason: 'some bad failure',
  totalCholesterolHdlRatio: null,
  totalCholesterolHdlRatioCategory: null,
  totalCholesterolHdlRatioFailureReason: 'failure because of bad failure'
} as unknown as ICholesterolScore;

const partialCholesterolHdlLow: ICholesterolScore = {
  overallCategory: OverallCholesterolCategory.PartialFailure,
  hdlCholesterol: 0.9,
  hdlCholesterolCategory: HdlCholesterolCategory.Low,
  totalCholesterol: null,
  totalCholesterolCategory: null,
  totalCholesterolFailureReason: 'some bad failure',
  totalCholesterolHdlRatio: null,
  totalCholesterolHdlRatioCategory: null,
  totalCholesterolHdlRatioFailureReason: 'failure because of bad failure'
} as unknown as ICholesterolScore;

const partialCholesterolTCNormal: ICholesterolScore = {
  overallCategory: OverallCholesterolCategory.PartialFailure,
  totalCholesterol: 4,
  totalCholesterolCategory: TotalCholesterolCategory.Normal,
  hdlCholesterolFailureReason: 'some bad failure',
  totalCholesterolHdlRatio: null,
  totalCholesterolHdlRatioCategory: null,
  totalCholesterolHdlRatioFailureReason: 'failure because of bad failure'
} as unknown as ICholesterolScore;

const partialCholesterolTCHigh: ICholesterolScore = {
  overallCategory: OverallCholesterolCategory.PartialFailure,
  totalCholesterol: 6,
  totalCholesterolCategory: TotalCholesterolCategory.High,
  hdlCholesterol: null,
  hdlCholesterolCategory: null,
  hdlCholesterolFailureReason: 'some bad failure',
  totalCholesterolHdlRatio: null,
  totalCholesterolHdlRatioCategory: null,
  totalCholesterolHdlRatioFailureReason: 'failure because of bad failure'
} as unknown as ICholesterolScore;

const partialCholesterolTCVeryHigh: ICholesterolScore = {
  overallCategory: OverallCholesterolCategory.PartialFailure,
  totalCholesterol: 7.7,
  totalCholesterolCategory: TotalCholesterolCategory.VeryHigh,
  hdlCholesterol: null,
  hdlCholesterolCategory: null,
  hdlCholesterolFailureReason: 'some bad failure',
  totalCholesterolHdlRatio: null,
  totalCholesterolHdlRatioCategory: null,
  totalCholesterolHdlRatioFailureReason: 'failure because of bad failure'
} as unknown as ICholesterolScore;

const cholesterolResultsHeading = 'Cholesterol results';

// incomplete cholesterol results card

const incompleteCholesterolResultsHeading =
  'Your cholesterol levels are incomplete';
const onlyHdlReturnedText =
  'The lab could only test the level of good cholesterol (HDL) in your blood sample.';
const onlyTotalReturnedText =
  'The lab could only measure the total amount of cholesterol that is in your bloodstream.';

// score card - hdl

const hdlCardDescription =
  'Good cholesterol (HDL) helps remove bad cholesterol (LDL) and other fats from your body.';
const healthyHdlCardParagraph =
  'Even with a healthy level of good cholesterol, you can still have a high level of bad cholesterol.';
const unhealthyHdlCardParagraph =
  'A low level of good cholesterol may mean your body is not clearing bad cholesterol effectively. This can increase your risk of heart disease or stroke.';

// score card - total cholesterol

const normalTotalText = 'This is in the healthy range (below 5mmol/L).';
const highTotalText =
  'This is high. A total cholesterol level below 5mmol/L is considered healthy.';
const veryHighTotalText =
  'This is very high. A total cholesterol level below 5mmol/L is considered healthy.';

const totalCardDescription =
  'Total cholesterol tells us how much cholesterol is in your blood.';
const unhealthyTotalCardDescription =
  'This does suggest a potential risk to your heart health.';

describe('Partial CholesterolResultsPage tests', () => {
  test.each([
    {
      cholesterolScore: partialCholesterolHdlNormal,
      contents: [
        cholesterolResultsHeading,
        incompleteCholesterolResultsHeading,
        onlyHdlReturnedText,
        'This is in the healthy range (above 1mmol/L).',
        hdlCardDescription,
        healthyHdlCardParagraph
      ]
    },
    {
      sex: Sex.Male,
      cholesterolScore: partialCholesterolHdlNormal,
      contents: [
        cholesterolResultsHeading,
        incompleteCholesterolResultsHeading,
        onlyHdlReturnedText,
        hdlCardDescription,
        healthyHdlCardParagraph
      ]
    },
    {
      sex: Sex.Female,
      cholesterolScore: partialCholesterolHdlLow,
      contents: [unhealthyHdlCardParagraph]
    },
    {
      cholesterolScore: partialCholesterolTCNormal,
      contents: [normalTotalText, totalCardDescription, onlyTotalReturnedText]
    },
    {
      cholesterolScore: partialCholesterolTCHigh,
      contents: [highTotalText, unhealthyTotalCardDescription]
    },
    {
      cholesterolScore: partialCholesterolTCVeryHigh,
      contents: [veryHighTotalText],
      urgentAdvice: true
    }
  ])(
    'partial cholesterol results',
    ({ cholesterolScore, contents, urgentAdvice = false }) => {
      const biometricScores: IBiometricScores[] = [
        {
          date: new Date().toISOString(),
          scores: {
            diabetes,
            cholesterol: cholesterolScore
          }
        }
      ];

      setHealthCheckData(biometricScores, Sex.Male);
      const history = createMemoryHistory();
      render(
        <Router location={history.location} navigator={history}>
          <CholesterolResultsPage />
        </Router>
      );

      for (const content of contents) {
        expect(screen.getByText(content)).toBeInTheDocument();
      }

      let expectedScore;
      let missingScoreLabelText;

      if (cholesterolScore.hdlCholesterol) {
        // has hdl so missing total cholesterol
        expectedScore = cholesterolScore.hdlCholesterol;
        missingScoreLabelText = 'Your total cholesterol is:';
      } else if (cholesterolScore.totalCholesterol) {
        // has total cholesterol so missing hdl
        expectedScore = cholesterolScore.totalCholesterol;
        missingScoreLabelText = 'Your level of good cholesterol (HDL) is:';
      } else {
        // otherwise is complete failure and not partal
        throw new Error('no valid partial results');
      }

      let adviceText = 'Non-urgent advice:';

      if (urgentAdvice) {
        adviceText = 'Urgent advice:';
      }

      expect(screen.getByText(adviceText)).toBeInTheDocument();

      expect(screen.getByText(`${expectedScore}mmol/L`)).toBeInTheDocument();

      const expectedMissing = screen.getByLabelText(missingScoreLabelText);
      expect(expectedMissing).toHaveTextContent('Not known');

      const ratioLevel = screen.getByLabelText(
        'Your total cholesterol to HDL ratio is:'
      );
      expect(ratioLevel).toHaveTextContent('Not known');
    }
  );

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
