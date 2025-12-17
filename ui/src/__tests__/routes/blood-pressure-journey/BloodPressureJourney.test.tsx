import { setupServer, type SetupServerApi } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BloodPressureJourney from '../../../routes/blood-pressure-journey/BloodPressureJourney';
import { JourneyStepNames, RoutePath } from '../../../lib/models/route-paths';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import {
  BloodPressureLocation,
  ConfirmLowBloodPressureSymptoms,
  type IBloodPressure,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import scheduleGpUpdateService, {
  GpUpdateReason
} from '../../../services/schedule-gp-update-service';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

jest.mock('../../../services/schedule-gp-update-service');

describe('BloodPressureJourney tests', () => {
  const server = setupServer(
    http.get('test.com/health-checks', () =>
      HttpResponse.json({
        healthChecks: [
          { questionnaire: {}, questionnaireScores: {}, id: '12345' }
        ] as IHealthCheck[]
      })
    ),
    http.post('test.com/events', () =>
      HttpResponse.text(null, { status: 200 })
    ),
    http.post('test.com/health-checks/12345/schedule-gp-update', () =>
      HttpResponse.text(null, { status: 200 })
    )
  );
  const createGpUpdateScheduleMock =
    scheduleGpUpdateService.createGpUpdateSchedule as jest.Mock;

  const routes = [
    { path: '/', element: <BloodPressureJourney /> },
    { path: RoutePath.BloodPressureJourney, element: <BloodPressureJourney /> },
    { path: RoutePath.TaskListPage, element: <div>Task list</div> }
  ];
  let setCurrentStepMock: jest.Mock;

  beforeAll(() => {
    server.listen();
    setCurrentStepMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      currentStep: JourneyStepNames.BloodPressureCheckPage,
      setCurrentStep: setCurrentStepMock
    });
  });

  afterEach(() => {
    server.resetHandlers();
    createGpUpdateScheduleMock.mockReset();
  });

  afterAll(() => server.close());

  test.each([
    [BloodPressureLocation.Pharmacy],
    [BloodPressureLocation.Monitor]
  ])(
    `Should redirect to ${RoutePath.TaskListPage} when blood pressure is measured "%s", is in norm range and confirmed`,
    async (readingPlace: BloodPressureLocation) => {
      const user = userEvent.setup();
      render(
        <QueryClientProvider client={new QueryClient()}>
          <RouterProvider router={createMemoryRouter(routes)} />
        </QueryClientProvider>
      );

      // check your blood pressure
      await waitForTitle('Check your blood pressure');
      expect(setCurrentStepMock).toHaveBeenLastCalledWith(
        JourneyStepNames.BloodPressureCheckPage
      );
      expect(screen.getByText('Back')).toBeInTheDocument();
      clickFirstPageButton(user, server, {
        isBloodPressureSectionSubmitted: false
      });

      await selectBloodPressureReadingPlaceAndContinue(
        user,
        readingPlace,
        server,
        {
          bloodPressureLocation: BloodPressureLocation.Monitor,
          isBloodPressureSectionSubmitted: false
        }
      );
      expect(setCurrentStepMock).toHaveBeenCalledWith(
        JourneyStepNames.BloodPressureLocationPage
      );
      await enterReadingAndContinue(user, '110', '60', server, {
        bloodPressureDiastolic: 60,
        bloodPressureSystolic: 110,
        bloodPressureLocation: BloodPressureLocation.Monitor,
        isBloodPressureSectionSubmitted: true
      });
      expect(setCurrentStepMock).toHaveBeenCalledWith(
        JourneyStepNames.EnterBloodPressurePage
      );

      // check your answers
      await waitForTitle('Check your answers');
      expect(setCurrentStepMock).toHaveBeenLastCalledWith(
        JourneyStepNames.ConfirmBloodPressurePage
      );
      expect(screen.getByText('Back')).toBeInTheDocument();
      await clickElement(user, 'Save and continue');

      // task-list
      const element = await waitForTitle('Task list');
      expect(setCurrentStepMock).toHaveBeenLastCalledWith(undefined);
      expect(element).not.toBeNull();
      expect(screen.queryByText('Back')).not.toBeInTheDocument();
    }
  );

  test('Should show "We need your blood pressure" page when user clicks "I cannot take my blood pressure"', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    // check your blood pressure
    await waitForTitle('Check your blood pressure');
    expect(screen.getByText('Back')).toBeInTheDocument();
    await clickElement(user, 'I cannot take my blood pressure reading');

    const element = await waitForTitle(
      'We need your blood pressure reading to continue'
    );
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(element).not.toBeNull();
  });

  test('Should show check your answers page when patient provides low blood pressure and has no symptoms', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    // check your blood pressure
    await waitForTitle('Check your blood pressure');
    expect(screen.getByText('Back')).toBeInTheDocument();
    clickFirstPageButton(user, server, {
      isBloodPressureSectionSubmitted: false
    });

    await selectBloodPressureReadingPlaceAndContinue(
      user,
      BloodPressureLocation.Monitor,
      server,
      {
        bloodPressureLocation: BloodPressureLocation.Monitor,
        isBloodPressureSectionSubmitted: false
      }
    );
    await enterReadingAndContinue(user, '75', '55', server, {
      bloodPressureDiastolic: 55,
      bloodPressureSystolic: 75,
      bloodPressureLocation: BloodPressureLocation.Monitor,
      lowBloodPressureValuesConfirmed: true,
      highBloodPressureValuesConfirmed: null,
      hasStrongLowBloodPressureSymptoms: false,
      isBloodPressureSectionSubmitted: false
    });
    await confirmBloodPressureReadingAndContinue(user, 75, 55);
    await determineLowBloodPressureSymptomsAndContinue(
      user,
      ConfirmLowBloodPressureSymptoms.Negative
    );

    // check your answers
    await waitForTitle('Check your answers');
    expect(screen.getByText('Back')).toBeInTheDocument();
    await clickElement(user, 'Save and continue');

    // task-list
    const element = await waitForTitle('Task list');
    expect(element).not.toBeNull();
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });

  test('Should show low blood pressure shutter page when patient provides low blood pressure and has symptoms', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    // check your blood pressure
    await waitForTitle('Check your blood pressure');
    expect(screen.getByText('Back')).toBeInTheDocument();
    clickFirstPageButton(user, server, {
      isBloodPressureSectionSubmitted: false
    });

    await selectBloodPressureReadingPlaceAndContinue(
      user,
      BloodPressureLocation.Monitor,
      server,
      {
        bloodPressureLocation: BloodPressureLocation.Monitor,
        isBloodPressureSectionSubmitted: false
      }
    );
    await enterReadingAndContinue(user, '75', '55', server, {
      bloodPressureDiastolic: 55,
      bloodPressureSystolic: 75,
      bloodPressureLocation: BloodPressureLocation.Monitor,
      lowBloodPressureValuesConfirmed: true,
      highBloodPressureValuesConfirmed: null,
      hasStrongLowBloodPressureSymptoms: true,
      isBloodPressureSectionSubmitted: false
    });
    await confirmBloodPressureReadingAndContinue(user, 75, 55);
    await determineLowBloodPressureSymptomsAndContinue(
      user,
      ConfirmLowBloodPressureSymptoms.Positive
    );

    const element = await waitForTitle(
      'You cannot complete your NHS Health Check online'
    );
    expect(element).not.toBeNull();
    expect(screen.queryByText('Back')).not.toBeInTheDocument();

    expect(createGpUpdateScheduleMock).toHaveBeenCalledWith(
      '12345',
      GpUpdateReason.urgentLowBP
    );
  });

  test.each([
    [BloodPressureLocation.Pharmacy, 180, 120],
    [BloodPressureLocation.Monitor, 170, 100]
  ])(
    'Should show high pressure warning page when blood pressure is high',
    async (
      readingPlace: BloodPressureLocation,
      systolic: number,
      diastolic: number
    ) => {
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={new QueryClient()}>
          <RouterProvider router={createMemoryRouter(routes)} />
        </QueryClientProvider>
      );

      // check your blood pressure
      await waitForTitle('Check your blood pressure');
      clickFirstPageButton(user, server, {
        isBloodPressureSectionSubmitted: false
      });
      expect(screen.getByText('Back')).toBeInTheDocument();

      // confirm where
      await selectBloodPressureReadingPlaceAndContinue(
        user,
        readingPlace,
        server,
        {
          bloodPressureLocation: readingPlace,
          isBloodPressureSectionSubmitted: false
        }
      );

      await enterReadingAndContinue(
        user,
        systolic.toString(),
        diastolic.toString(),
        server,
        {
          bloodPressureDiastolic: diastolic,
          bloodPressureSystolic: systolic,
          bloodPressureLocation: readingPlace,
          lowBloodPressureValuesConfirmed: null,
          highBloodPressureValuesConfirmed: true,
          hasStrongLowBloodPressureSymptoms: false,
          isBloodPressureSectionSubmitted: false
        }
      );

      // confirm reading
      await confirmBloodPressureReadingAndContinue(user, systolic, diastolic);

      // warning page
      const element = await waitForTitle('Your blood pressure reading is:');
      expect(element).not.toBeNull();
      expect(screen.queryByText('Back')).not.toBeInTheDocument();

      expect(createGpUpdateScheduleMock).toHaveBeenCalledWith(
        '12345',
        GpUpdateReason.urgentHighBP
      );
    }
  );

  test('Should schedule partial gp update on high blood pressure reading confirmation', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    // check your blood pressure
    await waitForTitle('Check your blood pressure');
    expect(screen.getByText('Back')).toBeInTheDocument();
    clickFirstPageButton(user, server, {
      isBloodPressureSectionSubmitted: false
    });

    await selectBloodPressureReadingPlaceAndContinue(
      user,
      BloodPressureLocation.Monitor,
      server,
      {
        bloodPressureLocation: BloodPressureLocation.Monitor,
        isBloodPressureSectionSubmitted: false
      }
    );
    await enterReadingAndContinue(user, '140', '90', server, {
      bloodPressureDiastolic: 90,
      bloodPressureSystolic: 140,
      bloodPressureLocation: BloodPressureLocation.Monitor,
      lowBloodPressureValuesConfirmed: null,
      highBloodPressureValuesConfirmed: null,
      hasStrongLowBloodPressureSymptoms: null,
      isBloodPressureSectionSubmitted: false
    });
    await confirmReading(user);

    expect(createGpUpdateScheduleMock).toHaveBeenCalledWith(
      '12345',
      GpUpdateReason.highBP
    );
  });
});

async function determineLowBloodPressureSymptomsAndContinue(
  user: UserEvent,
  value: ConfirmLowBloodPressureSymptoms
) {
  await waitForTitle('Do you have symptoms of fainting or dizziness?');
  expect(screen.getByText('Back')).toBeInTheDocument();
  await clickRadioItem(user, value);
  await clickElement(user, 'Continue');
}

async function confirmBloodPressureReadingAndContinue(
  user: UserEvent,
  systolicValue: number,
  diastolicValue: number
) {
  await waitForTitle(
    `You told us your blood pressure reading is ${systolicValue}/${diastolicValue}. Is this correct?`
  );
  await clickElement(user, "Yes, it's correct");
  await clickElement(user, 'Continue');
}

async function selectBloodPressureReadingPlaceAndContinue(
  user: UserEvent,
  readingPlace: BloodPressureLocation,
  server: SetupServerApi,
  questionnaire: Partial<IBloodPressure>
) {
  updateQuestionnaireServerHandler(server, questionnaire);
  await waitForTitle('Confirm where you will get a blood pressure reading');
  expect(screen.getByText('Back')).toBeInTheDocument();
  await clickRadioItem(
    user,
    EnumDescriptions.BloodPressureLocation[readingPlace]
  );
  await clickElement(user, 'Continue');
}

async function enterReadingAndContinue(
  user: UserEvent,
  systolicValue: string,
  diastolicValue: string,
  server: SetupServerApi,
  questionnaire: Partial<IBloodPressure>
) {
  updateQuestionnaireServerHandler(server, questionnaire);
  await waitForTitle('Enter your reading');
  expect(screen.getByText('Back')).toBeInTheDocument();
  const systolicInput = await screen.findByLabelText(
    'Systolic (the higher number)'
  );
  const diastolicInput = await screen.findByLabelText(
    'Diastolic (the lower number)'
  );

  await user.type(systolicInput, systolicValue);
  await user.type(diastolicInput, diastolicValue);
  await clickElement(user, 'Continue');
}

async function confirmReading(user: UserEvent) {
  await waitForTitle('Check your answers');
  expect(screen.getByText('Back')).toBeInTheDocument();
  await clickElement(user, 'Save and continue');
}

async function waitForTitle(pageTitle: string): Promise<void> {
  await waitFor(async () => {
    await screen.findByText(pageTitle);
  });
}

async function clickRadioItem(user: UserEvent, label: string): Promise<void> {
  const element = await screen.findByLabelText(label);
  await user.click(element);
}

async function clickElement(user: UserEvent, name: string): Promise<void> {
  const element = await screen.findByText(name);
  await user.click(element);
}

function clickFirstPageButton(
  user: UserEvent,
  server: SetupServerApi,
  questionnaire: Partial<IBloodPressure>
) {
  updateQuestionnaireServerHandler(server, questionnaire);
  clickElement(user, 'Continue');
}

function updateQuestionnaireServerHandler(
  server: SetupServerApi,
  questionnaire: Partial<IBloodPressure>
): void {
  server.use(
    http.post('test.com/health-checks/12345/questionnaire', () =>
      HttpResponse.json({
        updatedHealthCheck: {
          questionnaire: questionnaire,
          id: '12345'
        } as IHealthCheck
      })
    )
  );
}
