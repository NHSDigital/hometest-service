import { render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { type UserEvent, userEvent } from '@testing-library/user-event';
import { type SetupServerApi, setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BodyMeasurementsJourney from '../../../routes/body-measurements-journey/BodyMeasurementsJourney';
import { JourneyStepNames, RoutePath } from '../../../lib/models/route-paths';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import { type IBodyMeasurements } from '@dnhc-health-checks/shared';

describe('BodyMeasurementsJourney tests', () => {
  const server = setupServer(
    http.post('test.com/health-checks/12345/questionnaire', () =>
      HttpResponse.text()
    ),
    http.post('test.com/events', () => {
      eventSent = true;
      return HttpResponse.text(null, { status: 200 });
    }),
    http.post('test.com/health-checks/12345/schedule-gp-update', () =>
      HttpResponse.text(null, { status: 200 })
    )
  );
  let eventSent: boolean;
  const routes = [
    { path: '/', element: <BodyMeasurementsJourney /> },
    {
      path: RoutePath.BodyMeasurementsJourney,
      element: <BodyMeasurementsJourney />
    },
    { path: RoutePath.TaskListPage, element: <div>Task list</div> }
  ];
  let setCurrentStepMock: jest.Mock;

  beforeAll(() => {
    server.listen();
    setCurrentStepMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      currentStep: JourneyStepNames.HeightPage,
      setCurrentStep: setCurrentStepMock
    });
  });

  beforeEach(() => {
    eventSent = false;
    updateQuestionnaireServerHandler(server, {} as IBodyMeasurements);
  });

  afterAll(() => server.close());

  test(`Should redirect to ${RoutePath.TaskListPage} when all data are entered and confirmed`, async () => {
    const user = userEvent.setup();
    renderComponent();

    // height
    await waitForTitle('What is your height?');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.HeightPage
    );
    expect(screen.getByText('Back')).toBeInTheDocument();
    const heightInput = await screen.findByLabelText('Centimetres');
    await user.type(heightInput, '180');
    await clickContinue(user);

    // weight
    await waitForTitle('What is your weight?');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.WeightPage
    );
    expect(screen.getByText('Back')).toBeInTheDocument();
    const weightInput = await screen.findByLabelText('Kilograms');
    await user.type(weightInput, '90');
    await clickContinue(user);

    // waist measurement
    await waitForTitle('Measure your waist');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.MeasureYourWaistPage
    );
    expect(screen.getByText('Back')).toBeInTheDocument();
    await clickContinue(user);

    // enter waist measurement
    await waitForTitle('What is your waist measurement?');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.WaistMeasurementPage
    );
    expect(screen.getByText('Back')).toBeInTheDocument();
    const waistMeasurementInput = await screen.findByLabelText('Centimetres');
    await user.type(waistMeasurementInput, '100');
    await clickContinue(user);

    // check your answers
    await waitForTitle('Check your answers');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.CheckYourAnswersBodyMeasurementsPage
    );
    expect(screen.getByText('Back')).toBeInTheDocument();
    const saveAndContinue = await screen.findByText('Save and continue');
    await user.click(saveAndContinue);

    // task list
    const taskList = await waitForTitle('Task list');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(undefined);
    expect(taskList).not.toBeNull();
    expect(eventSent).toBeTruthy();
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });

  async function waitForTitle(pageTitle: string): Promise<void> {
    await waitFor(async () => {
      expect(await screen.findByText(pageTitle)).toBeInTheDocument();
    });
  }

  async function clickContinue(user: UserEvent): Promise<void> {
    const element = await screen.findByText('Continue');
    await user.click(element);
  }

  function renderComponent() {
    return render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );
  }

  function updateQuestionnaireServerHandler(
    server: SetupServerApi,
    questionnaire: Partial<IBodyMeasurements>
  ): void {
    server.use(
      http.get('test.com/health-checks', () =>
        HttpResponse.json({
          healthChecks: [
            {
              questionnaire: questionnaire,
              questionnaireScores: {
                leicesterRiskScore: 16
              },
              id: '12345'
            }
          ]
        })
      )
    );
  }
});
