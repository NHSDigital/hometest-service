import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CheckAndSubmitYourAnswersPage from '../../../routes/check-your-answers/CheckAndSubmitYourAnswersPage';
import { RoutePath } from '../../../lib/models/route-paths';
import {
  AuditEventType,
  BloodPressureLocation,
  EthnicBackground,
  ExerciseHours,
  Smoking
} from '@dnhc-health-checks/shared';

const patientId = 'abcd12345';

jest.mock('../../../lib/components/event-audit-button');
const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

describe('CheckAndSubmitYourAnswersPage tests', () => {
  const server = setupServer(
    http.post('test.com/health-checks/12345/questionnaire/submit', () => {
      submitCalled = true;
      return HttpResponse.text();
    }),
    http.get('test.com/health-checks', () =>
      HttpResponse.json({
        healthChecks: [
          {
            questionnaire: {
              bloodPressureDiastolic: 80,
              bloodPressureLocation: BloodPressureLocation.Monitor,
              bloodPressureSystolic: 120,
              cycleHours: ExerciseHours.ThreeHoursOrMore,
              detailedEthnicGroup: 'Bangladeshi',
              drinkAlcohol: 'Never',
              ethnicBackground: EthnicBackground.AsianOrAsianBritish,
              exerciseHours: ExerciseHours.LessThanOne,
              gardeningHours: ExerciseHours.LessThanOne,
              hasCompletedHealthCheckInLast5Years: false,
              hasFamilyHeartAttackHistory: 'No',
              hasFamilyDiabetesHistory: 'No',
              hasPreExistingCondition: false,
              height: 190,
              heightDisplayPreference: 'cm',
              houseworkHours: ExerciseHours.BetweenOneAndThree,
              sex: 'Male',
              smoking: Smoking.Never,
              lupus: false,
              severeMentalIllness: false,
              atypicalAntipsychoticMedication: false,
              migraines: false,
              impotence: false,
              steroidTablets: false,
              rheumatoidArthritis: false,
              walkHours: ExerciseHours.BetweenOneAndThree,
              walkPace: 'BriskPace',
              weight: 90,
              weightDisplayPreference: 'kg',
              workActivity: 'Sitting',
              waistMeasurement: 70,
              waistMeasurementDisplayPreference: 'cm'
            },
            questionnaireScores: {
              leicesterRiskScore: 10,
              auditScore: 0
            },
            id: '12345',
            dataModelVersion: '2.3.4',
            wasInvited: false,
            patientId
          }
        ]
      })
    )
  );

  let submitCalled = false;
  const routes = [
    { path: '/', element: <CheckAndSubmitYourAnswersPage /> },
    {
      path: RoutePath.BloodTestJourney,
      element: <div>Order a blood test kit</div>
    },
    { path: RoutePath.TaskListPage, element: <div>Task list</div> }
  ];

  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    submitCalled = false;
  });

  afterAll(() => server.close());

  afterEach(() => {
    mockTriggerAuditEvent.mockReset();
  });

  test(`Should call submit endpoint and navigate to ${RoutePath.BloodTestJourney} page when clicked submit button`, async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Check your answers')).toBeInTheDocument();
    });

    const submitButton = await screen.findByText('Submit');
    await user.click(submitButton);

    const answersSubmittedElement = await screen.findByText(
      'Order a blood test kit'
    );

    expect(answersSubmittedElement).toBeInTheDocument();
    expect(submitCalled).toBeTruthy();
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.SectionStartBloodTest,
      healthCheck: expect.objectContaining({
        id: '12345',
        dataModelVersion: '2.3.4'
      }),
      patientId
    });
  });

  test(`Should navigate to ${RoutePath.TaskListPage} page when clicked back button`, async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    const submitButton = await screen.findByText('Back');
    await user.click(submitButton);

    const answersSubmittedElement = await screen.findByText('Task list');

    expect(answersSubmittedElement).toBeInTheDocument();
    expect(submitCalled).toBeFalsy();
  });
});
