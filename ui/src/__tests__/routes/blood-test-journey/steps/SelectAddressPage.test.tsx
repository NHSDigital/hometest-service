import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SelectAddressPage from '../../../../routes/blood-test-journey/steps/SelectAddressPage';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { JourneyStepNames } from '../../../../lib/models/route-paths';
import {
  AuditEventType,
  type Address,
  type IHealthCheck
} from '@dnhc-health-checks/shared';

jest.mock('../../../../lib/components/event-audit-button');

const triggerAuditEventMock = jest.fn();
jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => ({
    triggerAuditEvent: triggerAuditEventMock
  })
}));

const updateHealthCheckBloodTestOrderMock = jest.fn();
const setIsPageInErrorMock = jest.fn();

describe('SelectAddressPage', () => {
  const mockAddresses = [
    {
      addressLine1: 'a1',
      addressLine2: 'a2',
      addressLine3: 'a3',
      postcode: 'mockPostcode',
      townCity: 'tc'
    },
    {
      addressLine1: 'a1_2',
      addressLine2: 'a2_2',
      addressLine3: 'a3_2',
      postcode: 'mockPostcode',
      townCity: 'tc'
    },
    {
      addressLine1: 'TooLongAddressLine1_'.repeat(10),
      addressLine2: 'a2_3',
      addressLine3: 'a3_3',
      postcode: 'mockPostcode',
      townCity: 'tc'
    },
    {
      addressLine1: 'a1_4',
      addressLine2: 'TooLongAddressLine2_'.repeat(10),
      addressLine3: 'a3_4',
      postcode: 'mockPostcode',
      townCity: 'tc'
    },
    {
      addressLine1: 'a1_5',
      addressLine2: 'a2_5',
      addressLine3: 'TooLongAddressLine3_'.repeat(10),
      postcode: 'mockPostcode',
      townCity: 'tc'
    }
  ];
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';

  beforeEach(() => {
    updateHealthCheckBloodTestOrderMock.mockReset();
    triggerAuditEventMock.mockReset();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  test.each([
    [undefined, 'Showing search results for mockPostcode.'],
    ['15', 'Showing search results for mockPostcode and 15.']
  ])(
    'renders the form with all radios not selected if address does not match',
    async (
      buildingNumber: string | undefined,
      expectedSearchResultsTextContent: string
    ) => {
      render(
        <BrowserRouter>
          <SelectAddressPage
            updateHealthCheckBloodTestOrder={
              updateHealthCheckBloodTestOrderMock
            }
            selectedAddress={{
              searchParams: { postcode: 'mockPostcode', buildingNumber },
              isBloodTestSectionSubmitted: false
            }}
            addressList={mockAddresses}
            healthCheck={healthCheck}
            patientId={patientId}
          />
        </BrowserRouter>
      );

      // assert
      const addressCount = mockAddresses.length;
      expect(
        await screen.findByText(`${addressCount} addresses found`)
      ).toBeInTheDocument();
      expect(
        await screen.findByText((_, element) => {
          return (
            element?.tagName.toLowerCase() === 'p' &&
            element?.getAttribute('aria-label')?.valueOf() ===
              expectedSearchResultsTextContent
          );
        })
      ).toBeInTheDocument();
      expect(
        await screen.findByText((_, element) => {
          return (
            element?.tagName.toLowerCase() === 'p' &&
            element?.textContent === expectedSearchResultsTextContent
          );
        })
      ).toBeInTheDocument();
      expect(await screen.findByText('Search again')).toBeInTheDocument();
      expect(
        await screen.findByText('Select your delivery address')
      ).toBeInTheDocument();

      const radioButton1: HTMLInputElement = screen.getByLabelText(
        getAddressDisplayText(mockAddresses[0])
      );
      const radioButton2: HTMLInputElement = screen.getByLabelText(
        getAddressDisplayText(mockAddresses[1])
      );

      expect(radioButton1).not.toBeChecked();
      expect(radioButton2).not.toBeChecked();
    }
  );

  it('when one of the addresses that are currently displayed was previously selected the radio for it is checked', () => {
    // act
    render(
      <BrowserRouter>
        <SelectAddressPage
          updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
          selectedAddress={{
            searchParams: { postcode: 'mockPostcode' },
            isBloodTestSectionSubmitted: false,
            address: mockAddresses[1]
          }}
          addressList={mockAddresses}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    const radioButton1: HTMLInputElement = screen.getByLabelText(
      getAddressDisplayText(mockAddresses[0])
    );
    const radioButton2: HTMLInputElement = screen.getByLabelText(
      getAddressDisplayText(mockAddresses[1])
    );

    expect(radioButton1).not.toBeChecked();
    expect(radioButton2).toBeChecked();
  });

  it('when previously selected address is not on current search list no addresses are selected and error on continue is shown', async () => {
    const savedAddress = { ...mockAddresses[1] };
    savedAddress.townCity = 'SomeOtherCity';

    // act
    render(
      <BrowserRouter>
        <SelectAddressPage
          updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
          selectedAddress={{
            searchParams: { postcode: 'mockPostcode' },
            isBloodTestSectionSubmitted: false,
            address: savedAddress
          }}
          addressList={mockAddresses}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    const radioButton1: HTMLInputElement = screen.getByLabelText(
      getAddressDisplayText(mockAddresses[0])
    );
    const radioButton2: HTMLInputElement = screen.getByLabelText(
      getAddressDisplayText(mockAddresses[1])
    );

    expect(radioButton1).not.toBeChecked();
    expect(radioButton2).not.toBeChecked();

    const button = screen.getByText('Use this address');
    await userEvent.click(button);

    expect(
      await screen.findAllByText('Select your delivery address')
    ).toHaveLength(3);
    expect(updateHealthCheckBloodTestOrderMock).not.toHaveBeenCalled();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
  });

  it('when address is selected, the choice is saved and event is sent', async () => {
    // act
    render(
      <BrowserRouter>
        <SelectAddressPage
          updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
          selectedAddress={{
            searchParams: { postcode: 'mockPostcode' },
            isBloodTestSectionSubmitted: false,
            address: mockAddresses[0]
          }}
          addressList={mockAddresses}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    const radioButton2: HTMLInputElement = screen.getByLabelText(
      getAddressDisplayText(mockAddresses[1])
    );

    expect(radioButton2).not.toBeChecked();
    await userEvent.click(radioButton2);

    const button = screen.getByText('Use this address');
    await userEvent.click(button);

    // assert
    expect(radioButton2).toBeChecked();
    expect(updateHealthCheckBloodTestOrderMock).toHaveBeenCalledWith({
      isBloodTestSectionSubmitted: false,
      address: mockAddresses[1]
    });
    expect(
      screen.getByText(
        JSON.stringify([
          {
            eventType: AuditEventType.DeliveryAddressSelected,
            healthCheck,
            patientId
          }
        ])
      )
    ).toBeInTheDocument();
  });

  it('redirects to search screen when search again is clicked', async () => {
    render(
      <BrowserRouter>
        <SelectAddressPage
          updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
          selectedAddress={{
            searchParams: { postcode: 'mockPostcode' },
            isBloodTestSectionSubmitted: false
          }}
          addressList={mockAddresses}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    // assert
    const searchAgainElement = await screen.findByText('Search again');
    await userEvent.click(searchAgainElement);
    expect(window.location.href).toBe(
      `http://localhost/blood-test?step=${JourneyStepNames.FindAddressPage}`
    );
  });

  it('emits an audit event if user chooses address with too long address line 1', async () => {
    render(
      <BrowserRouter>
        <SelectAddressPage
          updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
          selectedAddress={{
            searchParams: { postcode: 'mockedPostocode' },
            isBloodTestSectionSubmitted: false
          }}
          addressList={mockAddresses}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    const radioButton2: HTMLInputElement = screen.getByLabelText(
      getAddressDisplayText(mockAddresses[2]) // [2] address had long address line 1
    );

    await userEvent.click(radioButton2);

    const button = screen.getByText('Use this address');
    await userEvent.click(button);

    expect(triggerAuditEventMock).toHaveBeenCalledWith({
      healthCheck,
      patientId,
      eventType: AuditEventType.AddressLookupSelectionTooLong
    });
  });

  it('emits an audit event if user chooses address with too long address line 2', async () => {
    render(
      <BrowserRouter>
        <SelectAddressPage
          updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
          selectedAddress={{
            searchParams: { postcode: 'mockedPostocode' },
            isBloodTestSectionSubmitted: false
          }}
          addressList={mockAddresses}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    const radioButton2: HTMLInputElement = screen.getByLabelText(
      getAddressDisplayText(mockAddresses[3]) // [3] address had long address line 2
    );

    await userEvent.click(radioButton2);

    const button = screen.getByText('Use this address');
    await userEvent.click(button);

    expect(triggerAuditEventMock).toHaveBeenCalledWith({
      healthCheck,
      patientId,
      eventType: AuditEventType.AddressLookupSelectionTooLong
    });
  });

  it('emits an audit event if user chooses address with too long address line 3', async () => {
    render(
      <BrowserRouter>
        <SelectAddressPage
          updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
          selectedAddress={{
            searchParams: { postcode: 'mockedPostocode' },
            isBloodTestSectionSubmitted: false
          }}
          addressList={mockAddresses}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    const radioButton2: HTMLInputElement = screen.getByLabelText(
      getAddressDisplayText(mockAddresses[4]) // [4] address had long address line 3
    );

    await userEvent.click(radioButton2);

    const button = screen.getByText('Use this address');
    await userEvent.click(button);

    expect(triggerAuditEventMock).toHaveBeenCalledWith({
      healthCheck,
      patientId,
      eventType: AuditEventType.AddressLookupSelectionTooLong
    });
  });

  it('does not emit an audit event if user chooses too long address', async () => {
    render(
      <BrowserRouter>
        <SelectAddressPage
          updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
          selectedAddress={{
            searchParams: { postcode: 'mockedPostocode' },
            isBloodTestSectionSubmitted: false
          }}
          addressList={mockAddresses}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    const radioButton2: HTMLInputElement = screen.getByLabelText(
      getAddressDisplayText(mockAddresses[0]) // [0] regular address, no param is too long
    );

    await userEvent.click(radioButton2);

    const button = screen.getByText('Use this address');
    await userEvent.click(button);

    expect(triggerAuditEventMock).not.toHaveBeenCalled();
  });

  function getAddressDisplayText(address: Address): string {
    return [
      address.addressLine1,
      address.addressLine2,
      address.addressLine3,
      address.townCity,
      address.postcode
    ]
      .filter((field) => field !== undefined && field.trim() !== '')
      .join(', ');
  }
});
