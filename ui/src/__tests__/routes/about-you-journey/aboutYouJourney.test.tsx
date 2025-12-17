import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import AboutYouJourney from '../../../routes/about-you-journey/AboutYouJourney';
import { JourneyStepNames, RoutePath } from '../../../lib/models/route-paths';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router';
import userEvent, { type UserEvent } from '@testing-library/user-event';

describe('AboutYouJourney tests', () => {
  let questionnaireState: Record<string, any> = {};
  let setCurrentStepMock: jest.Mock;
  const server = setupServer(
    http.get('test.com/health-checks', () =>
      HttpResponse.json({ healthChecks: [{ questionnaire: {}, id: '12345' }] })
    ),
    http.post('test.com/events', () => {
      return HttpResponse.text(null, { status: 200 });
    })
  );

  const routes = [
    { path: '/', element: <AboutYouJourney /> },
    {
      path: RoutePath.AboutYouJourney,
      element: <AboutYouJourney />
    },
    { path: RoutePath.TaskListPage, element: <div>Task list</div> }
  ];

  beforeAll(() => {
    server.listen();
    setCurrentStepMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      currentStep: JourneyStepNames.TownsendPostcodePage,
      setCurrentStep: setCurrentStepMock
    });
  });

  beforeEach(() => {
    questionnaireState = {};
  });

  afterAll(() => server.close());

  // eslint-disable-next-line jest/expect-expect
  test('AboutYouJourney journey test, success', async () => {
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
              id: '12345'
            }
          });
        }
      )
    );

    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    await waitForTitle('Enter your postcode');
    clickContinue(user);
    await waitForTitle(
      'Have any of your parents or siblings had a heart attack or angina before the age of 60?'
    );
    await clickRadioItem(user, 'No');
    await clickContinue(user);
    await waitForTitle('Do you have a parent, sibling or child with diabetes?');
    await clickRadioItem(user, 'No');
    await clickContinue(user);
    await waitForTitle('What is your sex assigned at birth?');
    await clickRadioItem(user, 'Male');
    await clickContinue(user);
    await waitForTitle('What is your ethnic group?');
    await clickRadioItem(user, 'Other ethnic group');
    await clickContinue(user);
    await waitForTitle(
      'Which of the following best describes your ethnic group?'
    );
    await clickRadioItem(user, 'Arab');
    await clickContinue(user);
    await waitForTitle('Do you smoke?');
    await clickRadioItem(user, 'No, I have never smoked');
    await clickContinue(user);
    await waitForTitle(
      'Has a healthcare professional ever diagnosed you with lupus?'
    );
    await clickRadioItem(user, 'No, they have not');
    await clickContinue(user);
    await waitForTitle(
      'Has a healthcare professional ever diagnosed you with a severe mental health condition?'
    );
    await clickRadioItem(user, 'No, they have not');
    await clickContinue(user);
    await waitForTitle('Medicines for severe mental health conditions');
    await clickRadioItem(user, 'No, I am not');
    await clickContinue(user);
    await waitForTitle(
      'Has a healthcare professional ever diagnosed you with migraines?'
    );
    await clickRadioItem(user, 'No, they have not');
    await clickContinue(user);
    await waitForTitle(
      'Has a healthcare professional ever diagnosed you with erectile dysfunction, or have you ever taken medicine for it?'
    );
    await clickRadioItem(user, 'No');
    await clickContinue(user);
    await waitForTitle('Corticosteroid tablets');
    await clickRadioItem(user, 'No, I do not');
    await clickContinue(user);
    await waitForTitle(
      'Has a healthcare professional ever diagnosed you with rheumatoid arthritis?'
    );
    await clickRadioItem(user, 'No, they have not');
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
