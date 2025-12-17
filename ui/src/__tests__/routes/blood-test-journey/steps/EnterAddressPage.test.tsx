import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnterAddressPage from '../../../../routes/blood-test-journey/steps/EnterAddressPage';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import {
  AuditEventType,
  type IHealthCheckBloodTestOrder,
  type IHealthCheck
} from '@dnhc-health-checks/shared';

jest.mock('../../../../lib/components/event-audit-button');

const updateHealthCheckBloodTestOrderMock = jest.fn();
const setIsPageInErrorMock = jest.fn();

describe('EnterAddressPage tests', () => {
  const validOrder = {
    address: {
      addressLine1: 'a street',
      addressLine2: 'more street',
      addressLine3: 'even more street',
      townCity: 'some city',
      postcode: 'ABC 123'
    },
    isBloodTestSectionSubmitted: false
  };
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';

  beforeEach(() => {
    updateHealthCheckBloodTestOrderMock.mockReset();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  it('renders the form with all inputs empty answers if no address was provided', async () => {
    render(
      <EnterAddressPage
        order={{
          address: {
            addressLine1: '',
            addressLine2: '',
            addressLine3: '',
            townCity: '',
            postcode: ''
          },
          isBloodTestSectionSubmitted: false
        }}
        updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
        healthCheck={healthCheck}
        patientId={patientId}
      />
    );

    // assert
    expect(
      await screen.findByText('Enter your delivery address')
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Address line 1')).toHaveValue('');
    expect(screen.getByLabelText('Address line 2 (optional)')).toHaveValue('');
    expect(screen.getByLabelText('Address line 3 (optional)')).toHaveValue('');
    expect(screen.getByLabelText('Town or city')).toHaveValue('');
    expect(screen.getByLabelText('Postcode')).toHaveValue('');
  });

  it('when address section was already saved, the values are pre-populated', async () => {
    // act
    render(
      <EnterAddressPage
        order={validOrder}
        updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
        healthCheck={healthCheck}
        patientId={patientId}
      />
    );
    const button = screen.getByText('Continue');
    await userEvent.click(button);

    // assert
    expect(screen.getByLabelText('Address line 1')).toHaveValue('a street');
    expect(screen.getByLabelText('Address line 2 (optional)')).toHaveValue(
      'more street'
    );
    expect(screen.getByLabelText('Address line 3 (optional)')).toHaveValue(
      'even more street'
    );
    expect(screen.getByLabelText('Town or city')).toHaveValue('some city');
    expect(screen.getByLabelText('Postcode')).toHaveValue('ABC 123');
  });

  it('when address is correct then saves the correct result and sends event', async () => {
    const newPostcode = 'BS2 8ST';
    // act
    render(
      <EnterAddressPage
        order={validOrder}
        updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
        healthCheck={healthCheck}
        patientId={patientId}
      />
    );
    const postcodeInput = screen.getByLabelText('Postcode');

    fireEvent.change(postcodeInput, { target: { value: newPostcode } });

    const button = screen.getByText('Continue');
    await userEvent.click(button);

    // assert
    expect(postcodeInput).toHaveValue(newPostcode);
    expect(updateHealthCheckBloodTestOrderMock).toHaveBeenCalledWith({
      address: {
        ...validOrder.address,
        postcode: newPostcode
      },
      isBloodTestSectionSubmitted: validOrder.isBloodTestSectionSubmitted
    });
    expect(
      screen.getByText(
        JSON.stringify([
          {
            eventType: AuditEventType.DeliveryAddressEntered,
            healthCheck: healthCheck,
            patientId
          }
        ])
      )
    ).toBeInTheDocument();
  });

  it('validation is run after page load if the page is pre-populated with data', async () => {
    // act
    render(
      <EnterAddressPage
        order={{
          address: {
            addressLine1:
              'A very long address line 1, A very long address line 1',
            addressLine2:
              'A very long address line 2, A very long address line 2',
            addressLine3:
              'A very long address line 3, A very long address line 3',
            townCity: 'some city',
            postcode: 'ABC 123'
          },
          isBloodTestSectionSubmitted: false
        }}
        updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
        healthCheck={healthCheck}
        patientId={patientId}
      />
    );
    expect(
      await screen.findAllByText('Address line 1 must be 20 characters or less')
    ).toHaveLength(2);
    expect(
      await screen.findAllByText('Address line 2 must be 20 characters or less')
    ).toHaveLength(2);
    expect(
      await screen.findAllByText('Address line 3 must be 20 characters or less')
    ).toHaveLength(2);
  });

  it('validation is not run after page load if the page is not pre-populated with data', () => {
    // act
    render(
      <EnterAddressPage
        order={{
          isBloodTestSectionSubmitted: false
        }}
        updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
        healthCheck={healthCheck}
        patientId={patientId}
      />
    );

    expect(screen.getByLabelText('Address line 1')).toHaveValue('');
    expect(screen.getByLabelText('Address line 2 (optional)')).toHaveValue('');
    expect(screen.getByLabelText('Address line 3 (optional)')).toHaveValue('');
    expect(screen.getByLabelText('Town or city')).toHaveValue('');
    expect(screen.getByLabelText('Postcode')).toHaveValue('');

    expect(screen.queryByText(`Enter town or city`)).not.toBeInTheDocument();
    expect(screen.queryByText(`Enter postcode`)).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        `Enter address line 1, typically the building and street`
      )
    ).not.toBeInTheDocument();
  });

  test.each([
    // [addressLine1, addressLine1Error, townCity, townCityError, postcode, postcodeError]
    [
      null,
      'Enter address line 1, typically the building and street',
      'address 2',
      null,
      'address 3',
      null,
      null,
      'Enter town or city',
      null,
      'Enter postcode'
    ],
    [
      'address 1',
      null,
      'address 22222222222222',
      'Address line 2 must be 20 characters or less',
      '',
      null,
      'Town',
      null,
      'A',
      'Enter a valid postcode'
    ],
    [
      'address 1',
      null,
      '',
      null,
      'address 333333333333333',
      'Address line 3 must be 20 characters or less',
      'Town',
      null,
      'AB1 A',
      'Enter a full postcode'
    ],
    [
      'address 1',
      null,
      '',
      null,
      '',
      null,
      'Town',
      null,
      'RG',
      'Enter a full postcode'
    ],
    [
      '   longer input        ', // longer than max char limit, but with spaces that are trimmed
      null,
      '',
      null,
      '',
      null,
      null,
      'Enter town or city',
      'AB1 1',
      'Enter a full postcode'
    ],
    [
      '   longer input        ', // longer than max char limit, but with spaces that are trimmed
      null,
      '',
      null,
      '',
      null,
      null,
      'Enter town or city',
      '1AB 1AB',
      'Enter a valid postcode'
    ],
    [
      '   longer input        ', // longer than max char limit, but with spaces that are trimmed
      null,
      '',
      null,
      '',
      null,
      null,
      'Enter town or city',
      'AB1 AB',
      'Enter a valid postcode'
    ],
    [
      'address 1111111111111',
      'Address line 1 must be 20 characters or less',
      'address 22222222222222',
      'Address line 2 must be 20 characters or less',
      'address 333333333333333',
      'Address line 3 must be 20 characters or less',
      'verylongtownnnnnnnnnnnnn',
      'Town or city must be 20 characters or less',
      'BS2 8ST',
      null
    ]
  ])(
    'When address values are set incorrectly, the validation errors occur and answers are not saved [%#]',
    async (
      addressLine1: string | null,
      addressLine1Error: string | null,
      addressLine2: string | null,
      addressLine2Error: string | null,
      addressLine3: string | null,
      addressLine3Error: string | null,
      townCity: string | null,
      townCityError: string | null,
      postcode: string | null,
      postcodeError: string | null
      // eslint-disable-next-line max-params
    ) => {
      render(
        <EnterAddressPage
          order={
            {
              address: {
                addressLine1,
                addressLine2,
                addressLine3,
                townCity,
                postcode
              },
              isBloodTestSectionSubmitted: false
            } as IHealthCheckBloodTestOrder
          }
          updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      );

      const continueElement = screen.getByText('Continue');
      await userEvent.click(continueElement);
      expect(updateHealthCheckBloodTestOrderMock).not.toHaveBeenCalled();
      if (addressLine1Error) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(await screen.findAllByText(addressLine1Error)).toHaveLength(2);
      }
      if (addressLine2Error) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(await screen.findAllByText(addressLine2Error)).toHaveLength(2);
      }
      if (addressLine3Error) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(await screen.findAllByText(addressLine3Error)).toHaveLength(2);
      }
      if (townCityError) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(await screen.findAllByText(townCityError)).toHaveLength(2);
      }
      if (postcodeError) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(await screen.findAllByText(postcodeError)).toHaveLength(2);
      }
      expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
    }
  );
});
