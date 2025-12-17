import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import { type UserEvent, userEvent } from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JourneyStepNames, RoutePath } from '../../../lib/models/route-paths';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';
import BloodTestJourney from '../../../routes/blood-test-journey/BloodTestJourney';
import addressSearchService from '../../../services/address-search-service';
import { type IHealthCheck, AuditEventType } from '@dnhc-health-checks/shared';

jest.mock('../../../services/address-search-service', () => ({
  searchForAddress: jest.fn()
}));

const triggerAuditEventMock = jest.fn();
jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: triggerAuditEventMock
    };
  }
}));

describe('BloodTestJourney', () => {
  const healthCheckId = '12345';

  const veryLongAddressLine =
    'This is a very long address line, This is a very long address line, This is a veeeeery long address line';
  const searchAddressMock = addressSearchService.searchForAddress as jest.Mock;
  const server = setupServer(
    http.post(`test.com/health-checks/${healthCheckId}/blood-test`, () =>
      HttpResponse.text()
    ),
    http.get('test.com/health-checks', () =>
      HttpResponse.json({
        healthChecks: [
          {
            questionnaire: {},
            id: healthCheckId,
            dataModelVersion: '2.3.4',
            questionnaireScores: { leicesterRiskScore: 0 }
          }
        ] as IHealthCheck[]
      })
    ),
    http.post('test.com/events', () =>
      HttpResponse.text(null, { status: 200 })
    ),
    http.get('test.com/patient', () =>
      HttpResponse.json({ firstName: 'first', lastName: 'last' })
    )
  );
  const routes = [
    { path: '/', element: <BloodTestJourney /> },
    { path: RoutePath.BloodTestJourney, element: <BloodTestJourney /> },
    { path: RoutePath.TaskListPage, element: <div>Task list</div> }
  ];
  let setCurrentStepMock: jest.Mock;

  beforeAll(() => {
    server.listen();
    setCurrentStepMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      currentStep: JourneyStepNames.AlcoholQuestionPage,
      setCurrentStep: setCurrentStepMock,
      isPageInError: false,
      setIsPageInError: jest.fn()
    });
  });

  afterEach(() => {
    server.resetHandlers();
    searchAddressMock.mockReset();
  });

  afterAll(() => server.close());

  it('Should redirect to contact GP page on clicking "I do not want to do a blood test at home" link', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    await waitForHeading('Order a blood test kit');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.BloodTestDeclarationPage
    );
    await clickElement(user, 'I do not want to do a blood test at home');

    await waitForTitle('Book a face-to-face appointment with your GP surgery');
    expect(setCurrentStepMock).toHaveBeenCalledWith(
      JourneyStepNames.NeedBloodTestPage
    );
  });

  it.each([
    { addressLine1: veryLongAddressLine, addressLine2: '', addressLine3: '' },
    {
      addressLine1: 'Norm line',
      addressLine2: veryLongAddressLine,
      addressLine3: ''
    },
    {
      addressLine1: 'Norm line',
      addressLine2: '',
      addressLine3: veryLongAddressLine
    },
    {
      addressLine1: veryLongAddressLine,
      addressLine2: veryLongAddressLine,
      addressLine3: veryLongAddressLine
    }
  ])(
    'Should redirect to Enter address manually if the found address is too long',
    async (addressLines) => {
      const user = userEvent.setup();
      searchAddressMock.mockResolvedValue({
        addressList: [
          {
            ...addressLines,
            townCity: 'London',
            postcode: 'E1 8RD'
          }
        ]
      });
      render(
        <QueryClientProvider client={new QueryClient()}>
          <RouterProvider router={createMemoryRouter(routes)} />
        </QueryClientProvider>
      );

      await waitForHeading('Order a blood test kit');
      expect(setCurrentStepMock).toHaveBeenLastCalledWith(
        JourneyStepNames.BloodTestDeclarationPage
      );
      await clickButton(user, 'Order a blood test kit');

      await waitForTitle('Find your delivery address');
      expect(setCurrentStepMock).toHaveBeenCalledWith(
        JourneyStepNames.FindAddressPage
      );

      const postcode = await screen.findByLabelText('Postcode');
      const filter = await screen.findByLabelText(
        'Building number or name (optional)'
      );

      await user.type(postcode, 'E18RD');
      await user.type(filter, '24');

      await clickElement(user, 'Continue');

      await waitForTitle('Enter your delivery address');
      expect(setCurrentStepMock).toHaveBeenCalledWith(
        JourneyStepNames.EnterAddressPage
      );

      expect(searchAddressMock).toHaveBeenCalled();

      expect(triggerAuditEventMock).toHaveBeenCalledWith({
        healthCheck: expect.objectContaining({
          id: '12345',
          dataModelVersion: '2.3.4'
        }),
        eventType: AuditEventType.AddressLookupSelectionTooLong
      });
    }
  );

  it.each([
    { addressLine1: veryLongAddressLine, addressLine2: '', addressLine3: '' },
    {
      addressLine1: 'Norm line',
      addressLine2: veryLongAddressLine,
      addressLine3: ''
    },
    {
      addressLine1: 'Norm line',
      addressLine2: '',
      addressLine3: veryLongAddressLine
    },
    {
      addressLine1: veryLongAddressLine,
      addressLine2: veryLongAddressLine,
      addressLine3: veryLongAddressLine
    }
  ])(
    'Should redirect to Enter address manually if the one of the found address is too long and is selected',
    async (addressLines) => {
      const user = userEvent.setup();
      searchAddressMock.mockResolvedValue({
        addressList: [
          {
            ...addressLines,
            townCity: 'London',
            postcode: 'E1 8RD'
          },
          {
            addressLine1: 'Normal address',
            addressLine2: '',
            addressLine3: '',
            townCity: 'London',
            postcode: 'E1 8RD'
          }
        ]
      });
      render(
        <QueryClientProvider client={new QueryClient()}>
          <RouterProvider router={createMemoryRouter(routes)} />
        </QueryClientProvider>
      );

      await waitForHeading('Order a blood test kit');
      expect(setCurrentStepMock).toHaveBeenLastCalledWith(
        JourneyStepNames.BloodTestDeclarationPage
      );
      await clickButton(user, 'Order a blood test kit');

      await waitForTitle('Find your delivery address');
      expect(setCurrentStepMock).toHaveBeenCalledWith(
        JourneyStepNames.FindAddressPage
      );

      const postcode = await screen.findByLabelText('Postcode');
      const filter = await screen.findByLabelText(
        'Building number or name (optional)'
      );

      await user.type(postcode, 'E18RD');
      await user.type(filter, '24');

      await clickElement(user, 'Continue');
      expect(searchAddressMock).toHaveBeenCalled();

      await waitForTitle('Select your delivery address');
      expect(setCurrentStepMock).toHaveBeenCalledWith(
        JourneyStepNames.SelectAddressPage
      );

      await clickElementByLabel(user, veryLongAddressLine);
      await clickElement(user, 'Use this address');

      await waitForTitle('Enter your delivery address');
      expect(setCurrentStepMock).toHaveBeenCalledWith(
        JourneyStepNames.EnterAddressPage
      );
    }
  );

  it('Should be able to enter address manually and navigate back to search page', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={createMemoryRouter(routes)} />
      </QueryClientProvider>
    );

    await waitForHeading('Order a blood test kit');
    expect(setCurrentStepMock).toHaveBeenLastCalledWith(
      JourneyStepNames.BloodTestDeclarationPage
    );
    await clickButton(user, 'Order a blood test kit');

    await waitForTitle('Find your delivery address');
    expect(setCurrentStepMock).toHaveBeenCalledWith(
      JourneyStepNames.FindAddressPage
    );

    await clickElement(user, 'Enter address manually');

    await waitForTitle('Enter your delivery address');
    expect(setCurrentStepMock).toHaveBeenCalledWith(
      JourneyStepNames.EnterAddressPage
    );

    const addrLine1 = await screen.findByLabelText('Address line 1');
    const town = await screen.findByLabelText('Town or city');
    const postcode = await screen.findByLabelText('Postcode');

    await user.type(addrLine1, 'Some address');
    await user.type(town, 'London');
    await user.type(postcode, 'E18RD');

    await clickElement(user, 'Continue');

    await waitForTitle('Get text updates about your blood test');
    expect(setCurrentStepMock).toHaveBeenCalledWith(
      JourneyStepNames.EnterPhoneNumberPage
    );

    await clickElement(user, 'Continue');

    await waitForTitle('Confirm your details');
    expect(setCurrentStepMock).toHaveBeenCalledWith(
      JourneyStepNames.ConfirmDetailsPage
    );

    await clickElement(user, 'Back');

    await waitForTitle('Get text updates about your blood test');
    expect(setCurrentStepMock).toHaveBeenCalledWith(
      JourneyStepNames.EnterPhoneNumberPage
    );
    await clickElement(user, 'Back');

    await waitForTitle('Find your delivery address');
    expect(setCurrentStepMock).toHaveBeenCalledWith(
      JourneyStepNames.FindAddressPage
    );
  });
});

async function waitForHeading(pageTitle: string): Promise<void> {
  await waitFor(async () => {
    screen.getByRole('heading', { name: pageTitle });
  });
}

async function waitForTitle(pageTitle: string): Promise<void> {
  await waitFor(async () => {
    expect(await screen.findByText(pageTitle)).toBeInTheDocument();
  });
}

async function clickElement(user: UserEvent, name: string): Promise<void> {
  const element = await screen.findByText(name);
  await user.click(element);
}

async function clickButton(user: UserEvent, name: string): Promise<void> {
  const element = screen.getByRole('button', { name });
  await user.click(element);
}

async function clickElementByLabel(
  user: UserEvent,
  name: string
): Promise<void> {
  const element = await screen.findByLabelText(name, { exact: false });
  await user.click(element);
}
