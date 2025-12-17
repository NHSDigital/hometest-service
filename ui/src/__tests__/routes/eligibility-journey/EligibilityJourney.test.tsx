import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import EligibilityJourney from '../../../routes/eligibility-journey/EligibilityJourney';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  getStepUrl,
  JourneyStepNames,
  RoutePath
} from '../../../lib/models/route-paths';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';

describe('EligibilityJourney tests', () => {
  const server = setupServer(
    http.get('test.com/health-checks', () =>
      HttpResponse.json({ healthChecks: [{ questionnaire: {}, id: '12345' }] })
    ),
    http.post('test.com/events', () => HttpResponse.text(null, { status: 200 }))
  );
  const routes = [
    { path: '/', element: <EligibilityJourney /> },
    { path: RoutePath.EligibilityJourney, element: <EligibilityJourney /> },
    { path: RoutePath.TaskListPage, element: <div>Task list</div> }
  ];
  let setCurrentStepMock: jest.Mock;

  beforeAll(() => {
    server.listen();
    setCurrentStepMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      currentStep: JourneyStepNames.PreviousHealthCheckCompletedQueryPage,
      setCurrentStep: setCurrentStepMock
    });
  });

  afterAll(() => server.close());

  const renderComponent = () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );
  };

  const setupServerResponse = (response: object) => {
    server.use(
      http.post('test.com/health-checks/12345/questionnaire', () =>
        HttpResponse.json({ updatedHealthCheck: response })
      )
    );
  };

  test(`Should redirect to task list when user has no preexisting conditions and does not need to leave the online service`, async () => {
    setupServerResponse({
      questionnaire: {},
      id: '12345'
    });

    const user = userEvent.setup();
    renderComponent();

    await completeStep(
      user,
      'Did you receive an invitation from your GP surgery to do the NHS Health Check online?',
      'No',
      JourneyStepNames.ReceivedInvitationQueryPage,
      {
        hasReceivedAnInvitation: false
      }
    );
    await completeStep(
      user,
      'Have you completed an NHS Health Check in the last 5 years?',
      'No',
      JourneyStepNames.PreviousHealthCheckCompletedQueryPage,
      {
        hasReceivedAnInvitation: false,
        hasCompletedHealthCheckInLast5Years: false
      }
    );
    await completeStep(
      user,
      'Pre-existing health conditions',
      'No',
      JourneyStepNames.PreexistingHealthConditionsPage,
      {
        hasReceivedAnInvitation: false,
        hasCompletedHealthCheckInLast5Years: false,
        hasPreExistingCondition: false
      }
    );
    await completeStep(
      user,
      'Who should not use this online service',
      'No',
      JourneyStepNames.WhoShouldNotUseOnlineServicePage,
      {
        hasReceivedAnInvitation: false,
        hasCompletedHealthCheckInLast5Years: false,
        hasPreExistingCondition: false,
        canCompleteHealthCheckOnline: true
      }
    );

    await waitForTitle('Task list');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(undefined);
  });

  test(`Should redirect to task list skipping some screens when users answer they were invited`, async () => {
    setupServerResponse({
      questionnaire: {},
      id: '12345'
    });

    const user = userEvent.setup();
    renderComponent();

    await completeStep(
      user,
      'Did you receive an invitation from your GP surgery to do the NHS Health Check online?',
      'Yes',
      JourneyStepNames.ReceivedInvitationQueryPage,
      {
        hasReceivedAnInvitation: true
      }
    );
    await completeStep(
      user,
      'Who should not use this online service',
      'No',
      JourneyStepNames.WhoShouldNotUseOnlineServicePage,
      {
        hasReceivedAnInvitation: true,
        canCompleteHealthCheckOnline: true
      }
    );

    await waitForTitle('Task list');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(undefined);
  });

  // eslint-disable-next-line jest/expect-expect
  test('Should show not eligible screen when user has preexisting conditions', async () => {
    setupServerResponse({
      questionnaire: {},
      id: '12345'
    });

    const user = userEvent.setup();
    renderComponent();

    await completeStep(
      user,
      'Did you receive an invitation from your GP surgery to do the NHS Health Check online?',
      'No',
      JourneyStepNames.ReceivedInvitationQueryPage,
      {
        hasReceivedAnInvitation: false
      }
    );
    await completeStep(
      user,
      'Have you completed an NHS Health Check in the last 5 years?',
      'No',
      JourneyStepNames.PreviousHealthCheckCompletedQueryPage,
      {
        hasReceivedAnInvitation: false,
        hasCompletedHealthCheckInLast5Years: false
      }
    );
    await completeStep(
      user,
      'Pre-existing health conditions',
      'Yes',
      JourneyStepNames.PreexistingHealthConditionsPage,
      {
        hasReceivedAnInvitation: false,
        hasCompletedHealthCheckInLast5Years: false,
        hasPreExistingCondition: true
      }
    );

    await waitForTitle('Sorry, you cannot get an NHS Health Check right now');
  });

  test(`Should redirect to ${getStepUrl(RoutePath.EligibilityJourney, JourneyStepNames.ExtendedExclusionsShutterPage)} step when user needs to leave the online service`, async () => {
    setupServerResponse({
      questionnaire: {},
      id: '12345'
    });

    const user = userEvent.setup();
    renderComponent();

    await completeStep(
      user,
      'Did you receive an invitation from your GP surgery to do the NHS Health Check online?',
      'No',
      JourneyStepNames.ReceivedInvitationQueryPage,
      {
        hasReceivedAnInvitation: false
      }
    );
    await completeStep(
      user,
      'Have you completed an NHS Health Check in the last 5 years?',
      'No',
      JourneyStepNames.PreviousHealthCheckCompletedQueryPage,
      {
        hasReceivedAnInvitation: false,
        hasCompletedHealthCheckInLast5Years: false
      }
    );
    await completeStep(
      user,
      'Pre-existing health conditions',
      'No',
      JourneyStepNames.PreexistingHealthConditionsPage,
      {
        hasReceivedAnInvitation: false,
        hasCompletedHealthCheckInLast5Years: false,
        hasPreExistingCondition: false
      }
    );
    await completeStep(
      user,
      'Who should not use this online service',
      'Yes',
      JourneyStepNames.WhoShouldNotUseOnlineServicePage,
      {
        hasReceivedAnInvitation: false,
        hasCompletedHealthCheckInLast5Years: false,
        hasPreExistingCondition: false,
        canCompleteHealthCheckOnline: false
      }
    );

    await waitFor(async () =>
      expect(
        await screen.findByText(
          'Book a face-to-face appointment with your GP surgery'
        )
      ).toBeInTheDocument()
    );

    await waitFor(async () =>
      expect(
        await screen.findByText(
          'Ask your GP surgery about completing your NHS Health Check in a face-to-face appointment.'
        )
      ).toBeInTheDocument()
    );
  });

  test('First eligibility step (not invited path) has no Back link', async () => {
    server.use(
      http.get('test.com/health-checks', () =>
        HttpResponse.json({
          healthChecks: [
            {
              questionnaire: {},
              id: '12345'
            }
          ]
        })
      )
    );
    // Default server GET response already represents not invited path (wasInvited undefined/false)
    renderComponent();

    await waitForTitle(
      'Did you receive an invitation from your GP surgery to do the NHS Health Check online?'
    );

    // On first step there should be no back link rendered
    expect(
      screen.queryByRole('link', {
        name: 'Back'
      })
    ).not.toBeInTheDocument();
  });

  test('First eligibility step (invited path) has no Back link', async () => {
    server.use(
      http.get('test.com/health-checks', () =>
        HttpResponse.json({
          healthChecks: [
            {
              questionnaire: { hasReceivedAnInvitation: true },
              id: '12345',
              wasInvited: true
            }
          ]
        })
      )
    );

    renderComponent();

    await waitForTitle('Who should not use this online service');

    expect(
      screen.queryByRole('link', {
        name: 'Back'
      })
    ).not.toBeInTheDocument();
  });

  test('Second eligibility step shows Back link after answering first question (not invited path)', async () => {
    server.use(
      http.get('test.com/health-checks', () =>
        HttpResponse.json({
          healthChecks: [
            {
              questionnaire: {},
              id: '12345'
            }
          ]
        })
      )
    );

    renderComponent();

    // First step (no back link)
    await waitForTitle(
      'Did you receive an invitation from your GP surgery to do the NHS Health Check online?'
    );
    expect(
      screen.queryByRole('link', { name: 'Back' })
    ).not.toBeInTheDocument();

    // Answer first question with "No" so we continue to PreviousHealthCheckCompletedQueryPage
    setupServerResponse({
      questionnaire: { hasReceivedAnInvitation: false },
      id: '12345'
    });

    const user = userEvent.setup();
    await clickRadioItem(user, 'No');
    await clickContinue(user);

    // Second step should now render and include a back link
    await waitForTitle(
      'Have you completed an NHS Health Check in the last 5 years?'
    );

    expect(
      await screen.findByRole('link', {
        name: 'Back'
      })
    ).toBeInTheDocument();
  });

  async function completeStep(
    user: UserEvent,
    title: string,
    option: string,
    step: JourneyStepNames,
    hcQuestionnaireResponse?: object
  ) {
    if (hcQuestionnaireResponse) {
      setupServerResponse({
        questionnaire: hcQuestionnaireResponse,
        id: '12345'
      });
    }
    await waitForTitle(title);
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(step);
    await clickRadioItem(user, option);
    await clickContinue(user);
  }

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
});
