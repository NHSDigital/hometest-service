/* eslint-disable testing-library/render-result-naming-convention */
/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BloodPressureResultsPage from '../../../routes/results/BloodPressureResultsPage';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import {
  BloodPressureCategory,
  BloodPressureLocation,
  AuditEventType,
  PatientResultsDetailedOpenedPage
} from '@dnhc-health-checks/shared';
import { useHealthCheck } from '../../../hooks/healthCheckHooks';
import { type BloodPressurePageDetails } from '../../../routes/results/Blood-Pressure/BloodPressureBase';
import { BloodPressureHealthyDetails } from '../../../routes/results/Blood-Pressure/BloodPressureHealthyDetails';
import { BloodPressureHighDetails } from '../../../routes/results/Blood-Pressure/BloodPressureHighDetails';
import { BloodPressureLowNoFaintingDetails } from '../../../routes/results/Blood-Pressure/BloodPressureLowNoFaintingDetails';
import { BloodPressureSlightlyRaisedDetails } from '../../../routes/results/Blood-Pressure/BloodPressureSlightlyRaisedDetails';

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
function getHealthCheckData(
  bloodPressureLocation: BloodPressureLocation,
  bloodPressureCategory: BloodPressureCategory,
  bloodPressureSystolic: number,
  bloodPressureDiastolic: number
) {
  return {
    questionnaire: {
      bloodPressureLocation,
      bloodPressureSystolic,
      bloodPressureDiastolic
    },
    questionnaireScores: {
      bloodPressureCategory
    }
  };
}

function renderPage() {
  const history = createMemoryHistory();
  const { container } = render(
    <Router location={history.location} navigator={history}>
      <BloodPressureResultsPage />
    </Router>
  );
  return container;
}

function ensureRequiredHeadingsArePresent(headings: string[]) {
  for (const heading of headings) {
    expect(screen.getByText(heading)).toBeInTheDocument();
  }
}

describe('BloodPressureResultsPage tests', () => {
  test.each([
    [
      BloodPressureCategory.Low,
      BloodPressureLocation.Monitor,
      70,
      40,
      new BloodPressureLowNoFaintingDetails(BloodPressureLocation.Monitor),
      [
        'Your blood pressure is:',
        'Continue to check your blood pressure',
        'Call 111 if:',
        'Things you can do to help with low blood pressure symptoms'
      ]
    ],
    [
      BloodPressureCategory.Low,
      BloodPressureLocation.Pharmacy,
      70,
      40,
      new BloodPressureLowNoFaintingDetails(BloodPressureLocation.Pharmacy),
      [
        'Your blood pressure is:',
        'Follow the advice the healthcare professional gave you',
        'Call 111 if:',
        'Things you can do to help with low blood pressure symptoms'
      ]
    ],
    [
      BloodPressureCategory.Healthy,
      BloodPressureLocation.Monitor,
      100,
      70,
      new BloodPressureHealthyDetails(BloodPressureLocation.Monitor),
      [
        'Your blood pressure is:',
        'Your blood pressure reading is healthy.',
        'Get your blood pressure checked in 5 years',
        'How to help prevent high blood pressure'
      ]
    ],
    [
      BloodPressureCategory.Healthy,
      BloodPressureLocation.Pharmacy,
      100,
      70,
      new BloodPressureHealthyDetails(BloodPressureLocation.Pharmacy),
      [
        'Your blood pressure is:',
        'Your blood pressure reading is healthy.',
        'Follow the advice the healthcare professional gave you',
        'How to help prevent high blood pressure'
      ]
    ],
    [
      BloodPressureCategory.SlightlyRaised,
      BloodPressureLocation.Monitor,
      125,
      82,
      new BloodPressureSlightlyRaisedDetails(BloodPressureLocation.Monitor),
      [
        'Your blood pressure is:',
        'Take another reading in 1 month',
        'Speak to your GP or pharmacy if:',
        'Lowering your blood pressure'
      ]
    ],
    [
      BloodPressureCategory.SlightlyRaised,
      BloodPressureLocation.Pharmacy,
      130,
      85,
      new BloodPressureSlightlyRaisedDetails(BloodPressureLocation.Pharmacy),
      [
        'Your blood pressure is:',
        'Follow the advice the healthcare professional gave you',
        'Lowering your blood pressure'
      ]
    ],
    [
      BloodPressureCategory.High,
      BloodPressureLocation.Monitor,
      150,
      90,
      new BloodPressureHighDetails(BloodPressureLocation.Monitor),
      [
        'Your blood pressure is:',
        'Get tested at a GP surgery or pharmacy',
        'Lowering your blood pressure'
      ]
    ],
    [
      BloodPressureCategory.High,
      BloodPressureLocation.Pharmacy,
      150,
      100,
      new BloodPressureHighDetails(BloodPressureLocation.Pharmacy),
      [
        'Your blood pressure is:',
        'Follow the advice the healthcare professional gave you',
        'Call 111 if:',
        'Lowering your blood pressure'
      ]
    ]
  ])(
    `Should render page for category %s and location %s`,
    (
      bloodPressureCategory: BloodPressureCategory,
      bloodPressureLocation: BloodPressureLocation,
      bloodPressureSystolic: number,
      bloodPressureDiastolic: number,
      expectedPage: BloodPressurePageDetails,
      pageVariantHeadings: string[]
      // eslint-disable-next-line max-params
    ) => {
      (useHealthCheck as jest.Mock).mockReturnValue({
        data: getHealthCheckData(
          bloodPressureLocation,
          bloodPressureCategory,
          bloodPressureSystolic,
          bloodPressureDiastolic
        ),
        isSuccess: true,
        isPending: false,
        isError: false
      });

      const container = renderPage();

      const commonHeadings = ['Your blood pressure is:'];
      ensureRequiredHeadingsArePresent(commonHeadings);
      ensureRequiredHeadingsArePresent(pageVariantHeadings);
      expect(
        container.querySelector(`.${expectedPage.BloodPressureResultColor}`)
      ).toBeTruthy();
      expect(container.querySelector(`.nhsuk-bp-graph`)).toBeTruthy();
    }
  );
  test(`send '${AuditEventType.PatientResultsDetailedOpened}' event when page is rendered`, () => {
    const history = createMemoryHistory();
    render(
      <Router location={history.location} navigator={history}>
        <BloodPressureResultsPage />
      </Router>
    );
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      details: { page: PatientResultsDetailedOpenedPage.BloodPressure },
      healthCheck: expect.anything()
    });
  });

  test('throw error when the category is not one of the known ones', () => {
    const healthCheckDataWithError = {
      questionnaire: {
        bloodPressureLocation: 'With a monitor at home',
        bloodPressureSystolic: 100,
        bloodPressureDiastolic: 70
      },
      questionnaireScores: {
        bloodPressureCategory: 'unknown'
      }
    };

    (useHealthCheck as jest.Mock).mockReturnValue({
      data: healthCheckDataWithError,
      isSuccess: true,
      isPending: false,
      isError: false
    });
    const history = createMemoryHistory();
    const renderPage = () => {
      render(
        <Router location={history.location} navigator={history}>
          <BloodPressureResultsPage />
        </Router>
      );
    };

    expect(renderPage).toThrow('Unhandled Blood Pressure category: Unknown');
  });
});
