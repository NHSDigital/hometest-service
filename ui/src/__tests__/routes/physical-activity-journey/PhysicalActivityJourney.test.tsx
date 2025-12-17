import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PhysicalActivityJourney from '../../../routes/physical-activity-journey/PhysicalActivityJourney';
import { JourneyStepNames, RoutePath } from '../../../lib/models/route-paths';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import {
  ExerciseHours,
  WalkingPace,
  WorkActivity
} from '@dnhc-health-checks/shared';

describe('PhysicalActivityJourney tests', () => {
  const server = setupServer(
    http.get('test.com/health-checks', () =>
      HttpResponse.json({ healthChecks: [{ questionnaire: {}, id: '12345' }] })
    ),
    http.post('test.com/events', () => {
      eventSent = true;
      return HttpResponse.text(null, { status: 200 });
    })
  );
  let eventSent: boolean;
  const routes = [
    { path: '/', element: <PhysicalActivityJourney /> },
    {
      path: RoutePath.PhysicalActivityJourney,
      element: <PhysicalActivityJourney />
    },
    { path: RoutePath.TaskListPage, element: <div>Task list</div> }
  ];
  let setCurrentStepMock: jest.Mock;

  beforeAll(() => {
    server.listen();
    setCurrentStepMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      currentStep: JourneyStepNames.HoursExercisedPage,
      setCurrentStep: setCurrentStepMock
    });
  });

  beforeEach(() => {
    eventSent = false;
  });

  afterAll(() => server.close());

  test(`Should redirect to ${RoutePath.TaskListPage} when journey is finished`, async () => {
    server.use(
      http.post('test.com/health-checks/12345/questionnaire', () =>
        HttpResponse.json({
          updatedHealthCheck: {
            questionnaire: {
              exerciseHours: ExerciseHours.LessThanOne,
              walkHours: ExerciseHours.LessThanOne,
              walkPace: WalkingPace.AveragePace,
              cycleHours: ExerciseHours.LessThanOne,
              workActivity: WorkActivity.Sitting,
              gardeningHours: ExerciseHours.LessThanOne,
              houseworkHours: ExerciseHours.LessThanOne
            },
            id: '12345'
          }
        })
      )
    );

    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    // hours exercise
    await waitForTitle('How many hours do you exercise in a typical week?');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.HoursExercisedPage
    );
    await clickRadioItem(user, 'Less than 1 hour');
    await clickContinue(user);

    // walk hours
    await waitForTitle('How many hours do you walk in a typical week?');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.HoursWalkedPage
    );
    await clickRadioItem(user, 'Less than 1 hour');
    await clickContinue(user);

    // walking pace
    await waitForTitle(
      'How would you describe your usual walking pace? (optional)'
    );
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.WalkingPacePage
    );
    await clickRadioItem(user, 'Steady average pace');
    await clickContinue(user);

    // cycle hours
    await waitForTitle('How many hours do you cycle in a typical week?');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.HoursCycledPage
    );
    await clickRadioItem(user, 'Less than 1 hour');
    await clickContinue(user);

    // work activity
    await waitForTitle('How active are you in your work?');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.WorkActivityPage
    );
    await clickRadioItem(user, 'I spend most of my time at work sitting');
    await clickContinue(user);

    // everyday movement (option section)
    await waitForTitle('Everyday movement');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.EverydayMovementPage
    );
    await clickContinue(user);

    // housework
    await waitForTitle(
      'How many hours do you spend on housework or childcare in a typical week? (optional)'
    );
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.HoursHouseworkPage
    );
    await clickRadioItem(user, 'Less than 1 hour');
    await clickContinue(user);

    // gardening and DYI
    await waitForTitle(
      'How many hours do you spend on gardening or DIY in a typical week? (optional)'
    );
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.HoursGardeningPage
    );
    await clickRadioItem(user, 'Less than 1 hour');
    await clickContinue(user);

    // check your answer
    await waitForTitle('Check your answers');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.CheckYourAnswersPagePhysicalActivity
    );
    const element = await screen.findByText('Save and continue');
    await user.click(element);

    // task list
    const taskList = await waitForTitle('Task list');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(undefined);
    expect(taskList).not.toBeNull();
    expect(eventSent).toBeTruthy();
  });

  test(`Should redirect to ${RoutePath.TaskListPage} when journey is finished without optional fields`, async () => {
    server.use(
      http.post('test.com/health-checks/12345/questionnaire', () =>
        HttpResponse.json({
          updatedHealthCheck: {
            questionnaire: {
              cycleHours: ExerciseHours.LessThanOne,
              exerciseHours: ExerciseHours.LessThanOne,
              walkHours: ExerciseHours.LessThanOne,
              workActivity: WorkActivity.Sitting
            },
            id: '12345'
          }
        })
      )
    );

    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    // hours exercise
    await waitForTitle('How many hours do you exercise in a typical week?');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.HoursExercisedPage
    );
    await clickRadioItem(user, 'Less than 1 hour');
    await clickContinue(user);

    // walk hours
    await waitForTitle('How many hours do you walk in a typical week?');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.HoursWalkedPage
    );
    await clickRadioItem(user, 'Less than 1 hour');
    await clickContinue(user);

    // walking pace
    await waitForTitle(
      'How would you describe your usual walking pace? (optional)'
    );
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.WalkingPacePage
    );
    await clickContinue(user);

    // cycle hours
    await waitForTitle('How many hours do you cycle in a typical week?');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.HoursCycledPage
    );
    await clickRadioItem(user, 'Less than 1 hour');
    await clickContinue(user);

    // work activity
    await waitForTitle('How active are you in your work?');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.WorkActivityPage
    );
    await clickRadioItem(user, 'I spend most of my time at work sitting');
    await clickContinue(user);

    // everyday movement (optional section)
    await waitForTitle('Everyday movement');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.EverydayMovementPage
    );
    await clickContinue(user);

    // housework
    await waitForTitle(
      'How many hours do you spend on housework or childcare in a typical week? (optional)'
    );
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.HoursHouseworkPage
    );
    await clickContinue(user);

    // gardening and DYI
    await waitForTitle(
      'How many hours do you spend on gardening or DIY in a typical week? (optional)'
    );
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.HoursGardeningPage
    );
    await clickContinue(user);

    // check your answer
    await waitForTitle('Check your answers');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.CheckYourAnswersPagePhysicalActivity
    );
    const element = await screen.findByText('Save and continue');
    await user.click(element);

    // task list
    const taskList = await waitForTitle('Task list');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(undefined);
    expect(taskList).not.toBeNull();
    expect(eventSent).toBeTruthy();
  });
});

async function waitForTitle(pageTitle: string): Promise<void> {
  await waitFor(async () => {
    expect(await screen.findByText(pageTitle)).toBeInTheDocument();
  });
}

async function clickRadioItem(user: UserEvent, label: string): Promise<void> {
  const element = await screen.findByLabelText(label);
  await user.click(element);
}

async function clickContinue(user: UserEvent): Promise<void> {
  const element = await screen.findByText('Continue');
  await user.click(element);
}
