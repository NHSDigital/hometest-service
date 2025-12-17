import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FindAddressPage from '../../../../routes/blood-test-journey/steps/FindAddressPage';
import { BrowserRouter } from 'react-router-dom';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import {
  AuditEventType,
  type IHealthCheckBloodTestOrder,
  type IHealthCheck
} from '@dnhc-health-checks/shared';

const updateHealthCheckBloodTestOrderMock = jest.fn();
const setIsPageInErrorMock = jest.fn();
const mockTriggerAuditEvent = jest.fn();
jest.mock('../../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

describe('FindAddressPage tests', () => {
  const validOrder = {
    searchParams: {
      postcode: 'ABC 123',
      buildingNumber: '15'
    }
  };
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';
  const newPostcode = 'BS2 8ST';

  beforeEach(() => {
    updateHealthCheckBloodTestOrderMock.mockReset();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
    mockTriggerAuditEvent.mockReset();
  });

  it('renders the form with all inputs empty answers if no address was provided', async () => {
    render(
      <BrowserRouter>
        <FindAddressPage
          order={{
            searchParams: {
              postcode: '',
              buildingNumber: ''
            }
          }}
          searchForAddress={updateHealthCheckBloodTestOrderMock}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    // assert
    expect(
      await screen.findByText('Find your delivery address')
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Postcode')).toHaveValue('');
    expect(
      screen.getByLabelText('Building number or name (optional)')
    ).toHaveValue('');
  });

  it('when address section was already saved, the values are pre-populated', async () => {
    // act
    render(
      <BrowserRouter>
        <FindAddressPage
          order={validOrder}
          searchForAddress={updateHealthCheckBloodTestOrderMock}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );
    const button = screen.getByText('Continue');
    await userEvent.click(button);

    // assert
    expect(screen.getByLabelText('Postcode')).toHaveValue('ABC 123');
    expect(
      screen.getByLabelText('Building number or name (optional)')
    ).toHaveValue('15');
  });

  it('when address is correct then saves the correct result', async () => {
    // act
    render(
      <BrowserRouter>
        <FindAddressPage
          order={validOrder}
          searchForAddress={updateHealthCheckBloodTestOrderMock}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );
    const postcodeInput = screen.getByLabelText('Postcode');

    fireEvent.change(postcodeInput, { target: { value: newPostcode } });

    const button = screen.getByText('Continue');
    await userEvent.click(button);

    // assert
    expect(postcodeInput).toHaveValue(newPostcode);
    expect(updateHealthCheckBloodTestOrderMock).toHaveBeenCalledWith({
      searchParams: {
        postcode: newPostcode,
        buildingNumber: '15'
      },
      isBloodTestSectionSubmitted: false
    });
  });

  test.each([
    [null, 'Enter postcode', '', null],
    ['A', 'Enter a valid postcode', 'not too long          ', null],
    ['RG', 'Enter a full postcode', 'Very Valid', null],
    [
      'AB1',
      'Enter a full postcode',
      'too loooooooooooooooong',
      'Building name or number must be 20 characters or less'
    ],
    [
      'AB1 A',
      'Enter a full postcode',
      'too loooooooooooooooong',
      'Building name or number must be 20 characters or less'
    ],
    [
      'AB1 1',
      'Enter a full postcode',
      'too loooooooooooooooong',
      'Building name or number must be 20 characters or less'
    ],
    [
      '1AB 1AB',
      'Enter a valid postcode',
      'too loooooooooooooooong',
      'Building name or number must be 20 characters or less'
    ],
    [
      'AB1 AB',
      'Enter a valid postcode',
      'too loooooooooooooooong',
      'Building name or number must be 20 characters or less'
    ],
    [
      'AB1 1AB',
      null,
      'too loooooooooooooooong',
      'Building name or number must be 20 characters or less'
    ],
    ['AB1 AB1', 'Enter a valid postcode', 'A Building', null]
  ])(
    'when postcode or building number is incorrect, validation errors occur and answers are not saved [%#]',
    async (
      postcode: string | null,
      postcodeError: string | null,
      buildingNumber: string | null,
      buildingNumberError: string | null
    ) => {
      // act
      render(
        <BrowserRouter>
          <FindAddressPage
            order={
              {
                searchParams: {
                  buildingNumber,
                  postcode
                },
                isBloodTestSectionSubmitted: false
              } as IHealthCheckBloodTestOrder
            }
            searchForAddress={updateHealthCheckBloodTestOrderMock}
            healthCheck={healthCheck}
            patientId={patientId}
          />
        </BrowserRouter>
      );

      const button = screen.getByText('Continue');
      await userEvent.click(button);

      // assert
      if (postcodeError) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(await screen.findAllByText(postcodeError)).toHaveLength(2);
      }
      if (buildingNumberError) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(await screen.findAllByText(buildingNumberError)).toHaveLength(2);
      }
      expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
    }
  );

  it('when address search throws error, should send event', async () => {
    updateHealthCheckBloodTestOrderMock.mockRejectedValue(
      new Error('no address for you!')
    );

    // act
    render(
      <BrowserRouter>
        <FindAddressPage
          order={validOrder}
          searchForAddress={updateHealthCheckBloodTestOrderMock}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );
    const postcodeInput = screen.getByLabelText('Postcode');

    fireEvent.change(postcodeInput, { target: { value: newPostcode } });

    const button = screen.getByText('Continue');
    await userEvent.click(button);

    // assert
    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.ErrorAddressLookup,
      healthCheck,
      patientId
    });
  });
});
