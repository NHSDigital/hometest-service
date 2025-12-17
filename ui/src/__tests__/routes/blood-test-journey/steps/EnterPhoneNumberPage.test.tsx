import { fireEvent, render, screen } from '@testing-library/react';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import EnterPhoneNumberPage from '../../../../routes/blood-test-journey/steps/EnterPhoneNumberPage';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import {
  type IHealthCheck,
  type IHealthCheckBloodTestOrder
} from '@dnhc-health-checks/shared';

jest.mock('../../../../lib/contexts/PageTitleContext');

const updateHealthCheckBloodTestOrderMock = jest.fn();
const setIsPageInErrorMock = jest.fn();

describe('EnterPhoneNumberPage tests', () => {
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as any;
  const patientId = 'abcd12345';

  beforeEach(() => {
    jest.clearAllMocks();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  test('When the field is left empty, it should proceed to the next page', async () => {
    render(
      <BrowserRouter>
        <EnterPhoneNumberPage
          enteredPhoneNumber={
            {
              phoneNumber: '',
              isBloodTestSectionSubmitted: false
            } as IHealthCheckBloodTestOrder
          }
          updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );

    const continueButton = screen.getByText('Continue');
    await userEvent.click(continueButton);

    expect(
      await screen.findByText('Get text updates about your blood test')
    ).toBeInTheDocument();
  });

  test('When a valid phone number is entered, it should save the result', async () => {
    render(
      <BrowserRouter>
        <EnterPhoneNumberPage
          enteredPhoneNumber={
            {
              phoneNumber: '07700900000',
              isBloodTestSectionSubmitted: false
            } as IHealthCheckBloodTestOrder
          }
          updateHealthCheckBloodTestOrder={updateHealthCheckBloodTestOrderMock}
          healthCheck={healthCheck}
          patientId={patientId}
        />
      </BrowserRouter>
    );
    const phoneNumberInput = screen.getByLabelText(
      'Enter your UK mobile phone number (optional)'
    );
    fireEvent.change(phoneNumberInput, { target: { value: '07700900000' } });

    const continueButton = screen.getByText('Continue');
    await userEvent.click(continueButton);

    expect(phoneNumberInput).toHaveValue('07700900000');
    expect(updateHealthCheckBloodTestOrderMock).toHaveBeenCalledWith({
      phoneNumber: '07700900000',
      isBloodTestSectionSubmitted: false
    });
  });

  test.each([['789'], ['12345'], ['0789'], ['0789748493972266374'], ['error']])(
    'When the phone number is invalid [%#], it should display an error and set page in error',
    async (phoneNumber: string | null) => {
      render(
        <BrowserRouter>
          <EnterPhoneNumberPage
            enteredPhoneNumber={
              {
                phoneNumber,
                isBloodTestSectionSubmitted: false
              } as IHealthCheckBloodTestOrder
            }
            updateHealthCheckBloodTestOrder={
              updateHealthCheckBloodTestOrderMock
            }
            healthCheck={healthCheck}
            patientId={patientId}
          />
        </BrowserRouter>
      );

      const continueButton = screen.getByText('Continue');
      await userEvent.click(continueButton);

      const errorMessage = await screen.findByText(
        'Enter a UK mobile phone number in the correct format',
        {
          selector: 'span.nhsuk-error-message'
        }
      );
      expect(errorMessage).toBeInTheDocument();

      expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
    }
  );
});
