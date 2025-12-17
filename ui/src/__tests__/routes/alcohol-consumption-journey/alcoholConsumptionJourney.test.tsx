import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { JourneyStepNames, RoutePath } from '../../../lib/models/route-paths';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import AlcoholConsumptionJourney from '../../../routes/alcohol-consumption-journey/AlcoholConsumptionJourney';

describe('Alcohol Consumption Journey tests', () => {
  let setCurrentStepMock: jest.Mock;
  let questionnaireState: any = {};
  const server = setupServer(
    http.get('test.com/health-checks', () =>
      HttpResponse.json({
        healthChecks: [
          {
            id: '12345',
            questionnaire: {},
            questionnaireScores: { inProgressAuditScore: 0 },
            patientId: '12345'
          }
        ]
      })
    ),
    http.post('test.com/events', () => {
      return HttpResponse.text(null, { status: 200 });
    })
  );
  const routes = [
    { path: '/', element: <AlcoholConsumptionJourney /> },
    {
      path: RoutePath.AlcoholConsumptionJourney,
      element: <AlcoholConsumptionJourney />
    },
    { path: RoutePath.TaskListPage, element: <div>Task list</div> }
  ];

  beforeAll(() => {
    server.listen();
    setCurrentStepMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      currentStep: JourneyStepNames.AlcoholQuestionPage,
      setCurrentStep: setCurrentStepMock
    });
  });

  beforeEach(() => {});

  afterAll(() => server.close());

  // eslint-disable-next-line jest/expect-expect
  test('AlcoholConsumptionJourney journey test, success', async () => {
    server.use(
      http.post(
        'test.com/health-checks/12345/questionnaire',
        async ({ request }) => {
          const body = await request.json();
          questionnaireState = {
            ...(typeof questionnaireState === 'object' &&
            questionnaireState !== null
              ? questionnaireState
              : {}),
            ...(typeof body === 'object' && body !== null ? body : {})
          };
          return HttpResponse.json({
            updatedHealthCheck: {
              questionnaire: questionnaireState,
              id: '12345',
              questionnaireScores: { inProgressAuditScore: 5 },
              patientId: '12345'
            }
          });
        }
      )
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    const user = userEvent.setup();

    await waitForTitle('Do you drink alcohol?');
    await clickRadioItem(user, 'Yes, I drink alcohol');
    await clickContinue(user);
    await waitForTitle('How often do you have a drink containing alcohol?');
    await clickRadioItem(user, 'Monthly or less');
    await clickContinue(user);
    await waitForTitle(
      'On a typical day when you drink alcohol, how many units do you have?'
    );
    await clickRadioItem(user, '3 to 4');
    await clickContinue(user);
    await waitForTitle(
      "In the past year, how often have you had 6 or more alcohol units (if you're female) or 8 or more units (if male) on a single occasion?"
    );
    await clickRadioItem(user, 'Daily or almost daily');
    await clickContinue(user);
    await waitForTitle(
      'In the past year, how often have you found you were not able to stop drinking once you started?'
    );
    await clickRadioItem(user, 'Monthly');
    await clickContinue(user);
    await waitForTitle(
      'In the past year, how often have you failed to do what was expected of you because of your drinking?'
    );
    await clickRadioItem(user, 'Monthly');
    await clickContinue(user);
    await waitForTitle(
      'In the past year, how often have you needed an alcoholic drink in the morning to get going after a heavy drinking session?'
    );
    await clickRadioItem(user, 'Monthly');
    await clickContinue(user);
    await waitForTitle(
      'In the past year, how often have you felt guilty or remorseful after drinking?'
    );
    await clickRadioItem(user, 'Monthly');
    await clickContinue(user);
    await waitForTitle(
      'In the past year, how often have you been unable to remember what happened the night before because of your drinking?'
    );
    await clickRadioItem(user, 'Monthly');
    await clickContinue(user);
    await waitForTitle(
      'Have you or somebody else been injured as a result of your drinking?'
    );
    await clickRadioItem(user, 'Yes, but not in the past year');
    await clickContinue(user);
    await waitForTitle(
      'Has a relative, friend, doctor or other health worker been concerned about your drinking, or suggested that you cut down?'
    );
    await clickRadioItem(user, 'Yes, during the past year');
    await clickContinue(user);
    await waitForTitle('Check your answers');
  });
});

async function waitForTitle(pageTitle: string): Promise<void> {
  await waitFor(async () =>
    expect(await screen.findByText(pageTitle)).toBeInTheDocument()
  );
}

async function clickRadioItem(user: UserEvent, label: string): Promise<void> {
  const element = await screen.findByLabelText(label);
  await user.click(element);
}

async function clickContinue(user: UserEvent): Promise<void> {
  const element = await screen.findByText('Continue');
  await user.click(element);
}
