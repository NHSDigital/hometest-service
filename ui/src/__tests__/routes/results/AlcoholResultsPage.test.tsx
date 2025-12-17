import { render, screen } from '@testing-library/react';
import AlcoholResultsPage from '../../../routes/results/AlcoholResultsPage';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import {
  AuditCategory,
  AuditEventType,
  PatientResultsDetailedOpenedPage
} from '@dnhc-health-checks/shared';
import { useHealthCheck } from '../../../hooks/healthCheckHooks';

const mockTriggerAuditEvent = jest.fn();

jest.mock('../../../hooks/healthCheckHooks');
jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

function getHealthCheckData(auditCategory: AuditCategory, auditScore: number) {
  return {
    id: '12345',
    dataModelVersion: '2.3.4',
    questionnaire: {
      bloodPressureDiastolic: 60,
      bloodPressureLocation: 'With a monitor at home',
      bloodPressureSystolic: 80
    },
    questionnaireScores: {
      auditCategory,
      auditScore
    }
  };
}

afterEach(() => {
  mockTriggerAuditEvent.mockReset();
});

function renderPage() {
  const history = createMemoryHistory();
  render(
    <Router location={history.location} navigator={history}>
      <AlcoholResultsPage />
    </Router>
  );
}

describe('AlcoholResultsPage tests', () => {
  test(`send '${AuditEventType.PatientResultsDetailedOpened}' event when page is rendered`, () => {
    (useHealthCheck as jest.Mock).mockReturnValue({
      data: getHealthCheckData(AuditCategory.LowRisk, 0),
      isSuccess: true,
      isPending: false,
      isError: false
    });
    renderPage();

    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      details: { page: PatientResultsDetailedOpenedPage.Alcohol },
      healthCheck: expect.objectContaining({
        id: '12345',
        dataModelVersion: '2.3.4'
      })
    });
  });

  describe('No risk score results', () => {
    const alcoholNoRiskHealthCheck = getHealthCheckData(
      AuditCategory.LowRisk,
      0
    );

    beforeEach(() => {
      (useHealthCheck as jest.Mock).mockReturnValue({
        data: alcoholNoRiskHealthCheck,
        isSuccess: true,
        isPending: false,
        isError: false
      });
    });

    test('The page renders successfully', () => {
      renderPage();

      const heading = screen.getByText('Alcohol risk results');
      expect(heading).toBeInTheDocument();
      expect(screen.getByText('Low risk')).toBeInTheDocument();
      expect(
        screen.getByText(
          `Your score is ${alcoholNoRiskHealthCheck.questionnaireScores.auditScore}. You’re at low risk of alcohol-related health problems`,
          { exact: false }
        )
      ).toBeInTheDocument();
      expect(screen.getByText('What your score means')).toBeInTheDocument();
      expect(screen.getByText('Keeping your risk low')).toBeInTheDocument();
      expect(
        screen.getByText('Benefits of lower risk drinking')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Get medical advice before you stop drinking', {
          exact: false
        })
      ).not.toBeInTheDocument();
    });
  });

  describe('Low risk score results', () => {
    const alcoholLowRiskHealthCheck = getHealthCheckData(
      AuditCategory.LowRisk,
      3
    );

    beforeEach(() => {
      (useHealthCheck as jest.Mock).mockReturnValue({
        data: alcoholLowRiskHealthCheck,
        isSuccess: true,
        isPending: false,
        isError: false
      });
    });

    test('The page renders successfully', () => {
      renderPage();

      const heading = screen.getByText('Alcohol risk results');
      expect(heading).toBeInTheDocument();
      expect(screen.getByText('Low risk')).toBeInTheDocument();
      expect(
        screen.getByText(
          `Your score is ${alcoholLowRiskHealthCheck.questionnaireScores.auditScore}. You’re at low risk of alcohol-related health problems`,
          { exact: false }
        )
      ).toBeInTheDocument();
      expect(screen.getByText('What your score means')).toBeInTheDocument();
      expect(screen.getByText('Keeping your risk low')).toBeInTheDocument();
      expect(
        screen.getByText(
          'The UK Chief Medical Officers advise you to follow these guidelines, if you’re not already:'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText('Benefits of lower risk drinking')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Get medical advice before you stop drinking', {
          exact: false
        })
      ).not.toBeInTheDocument();
    });
  });

  describe('Increasing risk score results', () => {
    const alcoholIncreasingRiskHealthCheck = getHealthCheckData(
      AuditCategory.IncreasingRisk,
      11
    );

    beforeEach(() => {
      (useHealthCheck as jest.Mock).mockReturnValue({
        data: alcoholIncreasingRiskHealthCheck,
        isSuccess: true,
        isPending: false,
        isError: false
      });
    });

    test('The page renders successfully', () => {
      renderPage();

      const heading = screen.getByText('Alcohol risk results');
      expect(heading).toBeInTheDocument();
      expect(screen.getByText('Increasing risk')).toBeInTheDocument();
      expect(
        screen.getByText(
          `Your score is ${alcoholIncreasingRiskHealthCheck.questionnaireScores.auditScore}. This suggests your drinking increases the risks to your health`,
          { exact: false }
        )
      ).toBeInTheDocument();
      expect(screen.getByText('What your score means')).toBeInTheDocument();
      expect(screen.getByText('How to reduce your risk')).toBeInTheDocument();
      expect(
        screen.getByText('The UK Chief Medical Officers advise you to:', {
          exact: false
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText('Units of alcohol - guide', {
          exact: false
        })
      ).toBeInTheDocument();
      expect(screen.getByText('Benefits of cutting down')).toBeInTheDocument();
      expect(
        screen.getByText('Get medical advice before you stop drinking', {
          exact: false
        })
      ).toBeInTheDocument();
    });
  });

  describe('High risk score results', () => {
    const alcoholHighRiskHealthCheck = getHealthCheckData(
      AuditCategory.HighRisk,
      18
    );

    beforeEach(() => {
      (useHealthCheck as jest.Mock).mockReturnValue({
        data: alcoholHighRiskHealthCheck,
        isSuccess: true,
        isPending: false,
        isError: false
      });
    });

    test('The page renders successfully', () => {
      renderPage();

      const heading = screen.getByText('Alcohol risk results');
      expect(heading).toBeInTheDocument();
      expect(screen.getByText('High risk')).toBeInTheDocument();
      expect(
        screen.getByText(
          `Your score is ${alcoholHighRiskHealthCheck.questionnaireScores.auditScore}. This suggests you’re at higher risk of alcohol-related health problems.`,
          { exact: false }
        )
      ).toBeInTheDocument();
      expect(screen.getByText('What your score means')).toBeInTheDocument();
      expect(screen.getByText('How to reduce your risk')).toBeInTheDocument();
      expect(
        screen.getByText('The UK Chief Medical Officers advise you to:', {
          exact: false
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText('Units of alcohol - guide', {
          exact: false
        })
      ).toBeInTheDocument();
      expect(screen.getByText('Benefits of cutting down')).toBeInTheDocument();
      expect(
        screen.getByText('Get medical advice before you stop drinking', {
          exact: false
        })
      ).toBeInTheDocument();
    });
  });

  describe('Possible dependency score results', () => {
    const alcoholPossibleDependencyHealthCheck = getHealthCheckData(
      AuditCategory.PossibleDependency,
      39
    );

    beforeEach(() => {
      (useHealthCheck as jest.Mock).mockReturnValue({
        data: alcoholPossibleDependencyHealthCheck,
        isSuccess: true,
        isPending: false,
        isError: false
      });
    });

    test('The page renders successfully', () => {
      renderPage();

      const heading = screen.getByText('Alcohol risk results');
      expect(heading).toBeInTheDocument();
      expect(screen.getByText('Possible dependency')).toBeInTheDocument();
      expect(
        screen.getByText(
          `Your score is ${alcoholPossibleDependencyHealthCheck.questionnaireScores.auditScore}. This suggests you may be dependent on alcohol.`,
          { exact: false }
        )
      ).toBeInTheDocument();
      expect(screen.getByText('What your score means')).toBeInTheDocument();
      expect(
        screen.getByText('Get medical advice before you stop drinking', {
          exact: false
        })
      ).toBeInTheDocument();
    });
  });
});
