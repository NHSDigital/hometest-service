import { render, screen } from '@testing-library/react';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import { useHealthCheck } from '../../../hooks/healthCheckHooks';
import {
  type SmokingCategory,
  Smoking,
  AuditEventType,
  PatientResultsDetailedOpenedPage
} from '@dnhc-health-checks/shared';
import SmokingResultsPage from '../../../routes/results/Smoking/SmokingResultsPage';

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

jest.mock('../../../hooks/healthCheckHooks');

function getHealthCheckData(
  smoking: Smoking,
  smokingCategory: SmokingCategory
) {
  return {
    id: '12345',
    dataModelVersion: '2.3.4',
    questionnaire: {
      smoking
    },
    questionnaireScores: {
      smokingCategory
    }
  };
}

function renderPage() {
  const history = createMemoryHistory();
  render(
    <Router location={history.location} navigator={history}>
      <SmokingResultsPage />
    </Router>
  );
}
function setHealthCheckData(smoking: Smoking, smokingCategoryValue: string) {
  const smokingCategory = smokingCategoryValue as SmokingCategory;
  (useHealthCheck as jest.Mock).mockReturnValue({
    data: getHealthCheckData(smoking, smokingCategory),
    isSuccess: true,
    isPending: false,
    isError: false
  });
}

function testScreenToSeeIfHeadingsArePresent(headings: string[]) {
  for (const heading of headings) {
    expect(screen.getByText(heading)).toBeInTheDocument();
  }
}

describe('SmokingResultsPage tests', () => {
  describe('Never smoked', () => {
    const smokingPage = 'NeverSmoked';
    const smoking = Smoking.Never;
    test('The page renders successfully', () => {
      setHealthCheckData(smoking, smokingPage);
      renderPage();

      testScreenToSeeIfHeadingsArePresent([
        'You have never smoked',
        `This lowers your risk of cancer, lung disease, heart disease, stroke and dementia.`,
        'A great choice for your health',
        'By not smoking you:',
        'Useful resources'
      ]);

      const heading = screen.getByText('Smoking results');
      expect(heading).toBeInTheDocument();
      expect(
        screen.queryByText('Benefits of stopping smoking')
      ).not.toBeInTheDocument();
    });
  });

  it(`send '${AuditEventType.PatientResultsDetailedOpened}' event when page is rendered`, () => {
    const history = createMemoryHistory();
    render(
      <Router location={history.location} navigator={history}>
        <SmokingResultsPage />
      </Router>
    );

    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      details: { page: PatientResultsDetailedOpenedPage.Smoking },
      healthCheck: expect.objectContaining({
        id: '12345',
        dataModelVersion: '2.3.4'
      })
    });
  });

  describe('Ex smoker', () => {
    const smokingPage = 'ExSmoker';
    const smoking = Smoking.Quitted;
    test('The page renders successfully', () => {
      setHealthCheckData(smoking, smokingPage);
      renderPage();

      testScreenToSeeIfHeadingsArePresent([
        'You have already quit smoking',
        `This lowers your risk of cancer, lung disease, heart disease, stroke and dementia.`,
        'The benefits of not smoking',
        'Support to stay smoke-free',
        'For free help and support:',
        'Vaping to quit smoking',
        'Smoking, anxiety and mood'
      ]);

      const heading = screen.getByText('Smoking results');
      expect(heading).toBeInTheDocument();
      expect(
        screen.queryByText('You have never smoked')
      ).not.toBeInTheDocument();
    });
  });
  describe('Current smoker', () => {
    const smokingPage = 'CurrentSmoker';

    test('The page renders successfully 1-9', () => {
      const smoking = Smoking.UpToNinePerDay;
      setHealthCheckData(smoking, smokingPage);

      renderPage();

      testScreenToSeeIfHeadingsArePresent([
        'Benefits of stopping smoking',
        'When you quit, you:',
        'It’s never too late to stop',
        'To help stop smoking:',
        'Vaping to quit smoking',
        'Smoking, anxiety and mood',
        'For free help and support:',
        'This increases your risk of getting cancer, lung disease, heart disease, stroke and dementia.',
        'You smoke 1 to 9 cigarettes a day'
      ]);

      const heading = screen.getByText('Smoking results');
      expect(heading).toBeInTheDocument();
      expect(
        screen.queryByText('You have never smoked')
      ).not.toBeInTheDocument();
    });

    test('The page renders successfully 10-19', () => {
      const smoking = Smoking.TenToNineteenPerDay;
      setHealthCheckData(smoking, smokingPage);

      renderPage();

      testScreenToSeeIfHeadingsArePresent([
        'Benefits of stopping smoking',
        'When you quit, you:',
        'It’s never too late to stop',
        'To help stop smoking:',
        'Vaping to quit smoking',
        'Smoking, anxiety and mood',
        'For free help and support:',
        'This increases your risk of getting cancer, lung disease, heart disease, stroke and dementia.',
        'You smoke 10 to 19 cigarettes a day'
      ]);

      const heading = screen.getByText('Smoking results');
      expect(heading).toBeInTheDocument();
      expect(
        screen.queryByText('You have never smoked')
      ).not.toBeInTheDocument();
    });

    test('The page renders successfully 20+', () => {
      const smoking = Smoking.TwentyOrMorePerDay;
      setHealthCheckData(smoking, smokingPage);

      renderPage();

      testScreenToSeeIfHeadingsArePresent([
        'Benefits of stopping smoking',
        'When you quit, you:',
        'It’s never too late to stop',
        'To help stop smoking:',
        'Vaping to quit smoking',
        'Smoking, anxiety and mood',
        'For free help and support:',
        'This increases your risk of getting cancer, lung disease, heart disease, stroke and dementia.',
        'You smoke 20 or more cigarettes a day'
      ]);

      const heading = screen.getByText('Smoking results');
      expect(heading).toBeInTheDocument();
      expect(
        screen.queryByText('You have never smoked')
      ).not.toBeInTheDocument();
    });
  });
});
