import { render, screen } from '@testing-library/react';
import DiabetesRiskResultsPage from '../../../routes/results/Diabetes/DiabetesRiskResultsPage';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router';
import {
  AuditEventType,
  PatientResultsDetailedOpenedPage,
  DiabetesCategory,
  OverallDiabetesCategory
} from '@dnhc-health-checks/shared';
import { useHealthCheck } from '../../../hooks/healthCheckHooks';

const mockTriggerAuditEvent = jest.fn();

jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));
jest.mock('../../../hooks/healthCheckHooks');
afterEach(() => {
  mockTriggerAuditEvent.mockReset();
});
function getHealthCheckData(
  diabetesCategory: DiabetesCategory,
  overallCategory: OverallDiabetesCategory,
  hba1c: number
) {
  return {
    id: '12345',
    dataModelVersion: '2.3.4',
    biometricScores: [
      {
        scores: {
          date: new Date().toISOString(),
          diabetes: {
            category: diabetesCategory,
            overallCategory,
            hba1c: hba1c
          }
        }
      }
    ]
  };
}

function setHealthCheckData(
  diabetesCategory: DiabetesCategory,
  overallCategory: OverallDiabetesCategory,
  hba1c: number
) {
  (useHealthCheck as jest.Mock).mockReturnValue({
    data: getHealthCheckData(diabetesCategory, overallCategory, hba1c),
    isSuccess: true,
    isPending: false,
    isError: false
  });
}

describe('DiabetesRiskResultsPage tests', () => {
  test('The page renders successfully', () => {
    setHealthCheckData(DiabetesCategory.Low, OverallDiabetesCategory.Low, 41);
    const history = createMemoryHistory();

    render(
      <Router location={history.location} navigator={history}>
        <DiabetesRiskResultsPage />
      </Router>
    );

    const heading = screen.getByText('Diabetes results');
    expect(heading).toBeInTheDocument();
  });

  it(`send '${AuditEventType.PatientResultsDetailedOpened}' event when page is rendered`, () => {
    setHealthCheckData(DiabetesCategory.Low, OverallDiabetesCategory.Low, 41);

    const history = createMemoryHistory();
    render(
      <Router location={history.location} navigator={history}>
        <DiabetesRiskResultsPage />
      </Router>
    );

    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      details: { page: PatientResultsDetailedOpenedPage.Diabetes },
      healthCheck: expect.objectContaining({
        id: '12345',
        dataModelVersion: '2.3.4'
      })
    });
  });

  test.each([
    [
      DiabetesCategory.Low,
      OverallDiabetesCategory.Low,
      41,
      [
        'Moderate',
        'Your HbA1c blood test result is in the normal range (41 mmol/mol).',
        'However, other risk factors suggest you’re at moderate risk of developing type 2 diabetes.',
        'This reading is just a guide, not a diagnosis.',
        'Important',
        'Your risk could increase in future. Ask your GP surgery to check your risk of diabetes every 3 years.',
        'Type 2 diabetes explained',
        'How to manage your risk',
        'Tips to lower your risk',
        'Contact your GP surgery if:'
      ]
    ],
    [
      DiabetesCategory.AtRisk,
      OverallDiabetesCategory.AtRisk,
      45,
      [
        'High',
        'Your HbA1c blood test result is 45 mmol/mol. This suggests you’re at high risk of developing type 2 diabetes - this is known as prediabetes.',
        'This reading is just a guide, not a diagnosis.',
        'Contact your GP surgery',
        'Make an appointment at your GP surgery to discuss your result. They’ll give you a diagnosis, and help you understand what to do next. They’ll also follow up with you every year.',
        'Contact your GP surgery urgently if you experience any of the following symptoms:',
        'Type 2 diabetes explained',
        'How to manage your risk',
        'Tips to lower your risk'
      ]
    ],
    [
      DiabetesCategory.High,
      OverallDiabetesCategory.High,
      49,
      [
        'Possible diabetes',
        'Your HbA1c blood test result is 49 mmol/mol. This suggests possible type 2 diabetes.',
        'Contact your GP surgery to discuss your result within the next 24 hours. They will make a diagnosis, and help you understand what to do next.',
        'Call 999 or go to A&E now if:',
        'Type 2 diabetes explained',
        'How to manage your risk',
        'Tips to lower your risk'
      ]
    ],
    [
      DiabetesCategory.LowRiskNoBloodTest,
      OverallDiabetesCategory.LowRiskNoBloodTest,
      41,
      [
        'Low',
        'You’re at low risk of developing type 2 diabetes.',
        'This reading is just a guide, not a diagnosis.',
        'Important',
        'Your risk could increase in future. Ask your GP surgery to check your risk of diabetes every 3 years.',
        'Stay active and eat well',
        'Tips to keep your risk low'
      ]
    ]
  ])(
    'The page renders the correct details for the %s category',
    (diabetesCategory, overallDiabetesCategory, hba1c, contents) => {
      const history = createMemoryHistory();
      setHealthCheckData(diabetesCategory, overallDiabetesCategory, hba1c);
      render(
        <Router location={history.location} navigator={history}>
          <DiabetesRiskResultsPage />
        </Router>
      );

      // for dynamic content
      for (const content of contents) {
        const text = screen.getByText(content);
        expect(text).toBeInTheDocument();
      }

      const usefulResource = screen.getByText(
        'The following links open in a new tab.'
      );
      expect(usefulResource).toBeInTheDocument();

      const reduceDiabetesLink = screen.getByText(
        'Reduce your risk of type 2 diabetes - Diabetes UK'
      );
      const riskFactorsLink = screen.getByText(
        'Type 2 diabetes risk factors - Diabetes UK'
      );
      const diabetesLink = screen.getAllByText('Diabetes - nhs.uk');
      expect(reduceDiabetesLink).toBeInTheDocument();
      expect(riskFactorsLink).toBeInTheDocument();
      // the link is used a few other times depending on page
      expect(diabetesLink.length > 0).toBeTruthy();
    }
  );
});
