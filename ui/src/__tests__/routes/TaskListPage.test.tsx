import TaskListPage from '../../routes/TaskListPage';
import {
  type IHealthCheck,
  AuditEventType,
  HealthCheckSteps,
  BloodPressureLocation,
  ExerciseHours,
  Sex,
  EthnicBackground,
  Smoking,
  DoYouDrinkAlcohol,
  ParentSiblingHeartAttack,
  ParentSiblingChildDiabetes,
  HeightDisplayPreference,
  WalkingPace,
  WeightDisplayPreference,
  WorkActivity,
  WaistMeasurementDisplayPreference
} from '@dnhc-health-checks/shared';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryRouter,
  type RouteObject,
  RouterProvider
} from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RoutePath } from '../../lib/models/route-paths';
import { HttpCallStatus } from '../../services/health-check-service';

jest.mock('../../settings', () => ({
  ...jest.requireActual('../../settings'),
  healthCheckAutoExpireAfterDays: 28 // Actually configuration is 28 days
}));

function createMockedHealthCheck(step: HealthCheckSteps): {
  healthChecks: Partial<IHealthCheck>[];
} {
  return {
    healthChecks: [
      {
        questionnaire: {
          hasReceivedAnInvitation: false,
          hasCompletedHealthCheckInLast5Years: false,
          hasPreExistingCondition: false,
          canCompleteHealthCheckOnline: true,
          isAboutYouSectionSubmitted: true,
          isAlcoholSectionSubmitted: true,
          isBodyMeasurementsSectionSubmitted: true,
          isPhysicalActivitySectionSubmitted: true,
          isBloodPressureSectionSubmitted: true,
          bloodPressureDiastolic: 80,
          bloodPressureLocation: BloodPressureLocation.Monitor,
          bloodPressureSystolic: 120,
          cycleHours: ExerciseHours.ThreeHoursOrMore,
          detailedEthnicGroup: 'Bangladeshi',
          drinkAlcohol: DoYouDrinkAlcohol.Never,
          ethnicBackground: EthnicBackground.AsianOrAsianBritish,
          exerciseHours: ExerciseHours.LessThanOne,
          gardeningHours: ExerciseHours.LessThanOne,
          hasFamilyHeartAttackHistory: ParentSiblingHeartAttack.No,
          hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.No,
          height: 190,
          heightDisplayPreference: HeightDisplayPreference.Centimetres,
          houseworkHours: ExerciseHours.BetweenOneAndThree,
          sex: Sex.Male,
          smoking: Smoking.Never,
          walkHours: ExerciseHours.BetweenOneAndThree,
          walkPace: WalkingPace.BriskPace,
          weight: 90,
          weightDisplayPreference: WeightDisplayPreference.Kilograms,
          workActivity: WorkActivity.Sitting,
          waistMeasurement: 100,
          waistMeasurementDisplayPreference:
            WaistMeasurementDisplayPreference.Centimetres
        },
        id: '12345',
        step,
        createdAt: '2024-01-01T00:00:00Z',
        questionnaireCompletionDate: '2024-01-01T00:00:00Z',
        wasInvited: false
      }
    ]
  };
}

describe('TaskListPage tests', () => {
  window.nhsapp = { tools: { isOpenInNHSApp: () => false } };
  const server = setupServer(
    http.post('test.com/health-checks/12345/questionnaire', () =>
      HttpResponse.text()
    ),
    http.get('test.com/health-checks', () =>
      HttpResponse.json(createMockedHealthCheck(HealthCheckSteps.INIT))
    ),
    http.post('test.com/events', async ({ request }) => {
      const body = (await request.json()) as Record<string, string>;
      eventType = body.eventType;
      return HttpResponse.text(null, { status: 200 });
    })
  );
  const mockHealthCheckService = {
    getHealthCheckById: jest.fn(),
    updateHealthCheckQuestionnaireAnswers: jest.fn(),
    createHealthCheck: jest.fn(),
    getHealthChecksByToken: jest.fn()
  };
  const existingHealthChecks: IHealthCheck[] = [
    {
      id: '1234',
      nhsNumber: '56565656'
    } as unknown as IHealthCheck
  ];
  let eventType: string;
  let routes: RouteObject[];
  let queryClient: QueryClient;

  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    eventType = '';
    queryClient = new QueryClient();
    queryClient.clear();
    routes = [
      {
        path: '/',
        element: <TaskListPage />
      }
    ];
    mockHealthCheckService.getHealthChecksByToken.mockResolvedValue({
      status: HttpCallStatus.Successful,
      healthChecks: existingHealthChecks
    });

    server.resetHandlers();
    server.use(
      http.get('test.com/health-checks', () =>
        HttpResponse.json(createMockedHealthCheck(HealthCheckSteps.INIT))
      )
    );
  });

  afterEach(() => {
    server.resetHandlers();
    mockHealthCheckService.getHealthChecksByToken.mockReset();
  });

  afterAll(() => server.close());

  it('renders NHS Health Check incomplete', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    const text = await screen.findByText('NHS Health Check incomplete');
    expect(text).toBeInTheDocument();
  });

  it.each([
    [
      'About you',
      RoutePath.AboutYouJourney,
      AuditEventType.SectionStartAboutYou
    ],
    [
      'Physical activity',
      RoutePath.PhysicalActivityJourney,
      AuditEventType.SectionStartPhysicalActivity
    ],
    [
      'Alcohol consumption',
      RoutePath.AlcoholConsumptionJourney,
      AuditEventType.SectionStartAlcoholConsumption
    ],
    [
      'Enter body measurements',
      RoutePath.BodyMeasurementsJourney,
      AuditEventType.SectionStartBodyMeasurements
    ],
    [
      'Check your blood pressure',
      RoutePath.BloodPressureJourney,
      AuditEventType.SectionStartBloodPressure
    ]
  ])(
    'Navigates to %s and emits start section event',
    async (
      sectionTitle: string,
      sectionPath: RoutePath,
      sentEventType: AuditEventType
    ) => {
      routes = [
        ...routes,
        {
          path: sectionPath,
          element: <div>{`${sectionTitle} page`}</div>
        }
      ];
      render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={createMemoryRouter(routes)} />
        </QueryClientProvider>
      );

      const linkElement = await screen.findByText(sectionTitle);
      await userEvent.click(linkElement);

      const title = await screen.findByText(`${sectionTitle} page`);
      expect(title).toBeInTheDocument();
      expect(eventType).toBe(sentEventType);
    }
  );

  it('Does not render expiry section when health check has moved beyond INIT step', async () => {
    server.use(
      http.get('test.com/health-checks', () =>
        HttpResponse.json(
          createMockedHealthCheck(HealthCheckSteps.QUESTIONNAIRE_COMPLETED)
        )
      )
    );

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('NHS Health Check')).toBeInTheDocument();
    });

    await waitFor(() => {
      const paragraphElement = screen.queryByText(/You have until/i);
      expect(paragraphElement).not.toBeInTheDocument();
    });
  });

  it.each([
    HealthCheckSteps.QUESTIONNAIRE_COMPLETED,
    HealthCheckSteps.LAB_ORDERS_SCHEDULED,
    HealthCheckSteps.LAB_ORDERS_PLACED
  ])(
    'renders expiry time to user when step is %s',
    async (healthCheckStep: HealthCheckSteps) => {
      server.use(
        http.get('test.com/health-checks', () =>
          HttpResponse.json(createMockedHealthCheck(healthCheckStep))
        )
      );

      render(
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={createMemoryRouter(routes)} />
        </QueryClientProvider>
      );

      const expectedYouHaveUntilDateText =
        'Your NHS Health Check will expire if we do not have your results back from the lab by 31 March 2024.';

      expect(
        await screen.findByText((_, element) => {
          return (
            element?.tagName.toLowerCase() === 'p' &&
            element?.textContent === expectedYouHaveUntilDateText
          );
        })
      ).toBeInTheDocument();
    }
  );

  it('renders expiry time to user when step is INIT', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    // assert
    const expectedYouHaveUntilDateText =
      'You have until 29 January 2024 to complete sections 1 to 4 and submit your answers.';

    expect(
      await screen.findByText((_, element) => {
        return (
          element?.tagName.toLowerCase() === 'p' &&
          element?.getAttribute('aria-label')?.valueOf() ===
            expectedYouHaveUntilDateText
        );
      })
    ).toBeInTheDocument();

    expect(
      await screen.findByText((_, element) => {
        return (
          element?.tagName.toLowerCase() === 'p' &&
          element?.textContent === expectedYouHaveUntilDateText
        );
      })
    ).toBeInTheDocument();
  });
});
