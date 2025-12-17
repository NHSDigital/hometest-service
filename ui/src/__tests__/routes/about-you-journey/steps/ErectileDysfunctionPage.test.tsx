import { fireEvent, render, screen } from '@testing-library/react';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { type IAboutYou } from '@dnhc-health-checks/shared';
import ErectileDysfunctionPage from '../../../../routes/about-you-journey/steps/ErectileDysfunctionPage';

enum ErectileDysfunction {
  Yes = 'Yes',
  No = 'No'
}

describe('ErectileDysfunctionPage', () => {
  let aboutYouMock = {} as IAboutYou;
  let updateHealthCheckAnswersMock: jest.Mock;
  let setIsPageInErrorMock: jest.Mock;

  const renderComponent = (aboutYou?: IAboutYou) =>
    render(
      <ErectileDysfunctionPage
        healthCheckAnswers={aboutYou ?? aboutYouMock}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );

  beforeEach(() => {
    aboutYouMock = { impotence: null } as IAboutYou;

    updateHealthCheckAnswersMock = jest.fn();
    setIsPageInErrorMock = jest.fn();

    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  test('renders erectile dysfunction question', () => {
    renderComponent();

    const text = screen.getByText(
      'Has a healthcare professional ever diagnosed you with erectile dysfunction, or have you ever taken medicine for it?'
    );

    expect(text).toBeInTheDocument();
  });

  test('renders the error message when trying to press continue without selecting an answer', () => {
    renderComponent();

    let errorMessage = screen.queryByText('There is a problem');
    expect(errorMessage).not.toBeInTheDocument();

    const submitButton: HTMLInputElement = screen.getByText('Continue');

    fireEvent.click(submitButton);

    errorMessage = screen.getByText('There is a problem');
    expect(errorMessage).toBeInTheDocument();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);

    expect(screen.getByText('Error:')).toBeVisible();
    const errorElements = screen.getAllByText(
      'Select if a healthcare professional has ever diagnosed you with erectile dysfunction, or you have ever taken medicine for it'
    );
    expect(errorElements.length).toEqual(2);

    errorElements.forEach((msg) => {
      expect(msg).toBeVisible();
    });
  });

  test.each([[ErectileDysfunction.Yes], [ErectileDysfunction.No]])(
    'When %s is clicked then the radio button is checked and stores the data when submitted',
    (answer: string) => {
      renderComponent();

      const radioButton: HTMLInputElement = screen.getByLabelText(answer);
      const submitButton: HTMLInputElement = screen.getByText('Continue');

      expect(radioButton).not.toBeChecked();

      fireEvent.click(radioButton);
      fireEvent.click(submitButton);

      expect(radioButton).toBeChecked();
      expect(updateHealthCheckAnswersMock).toHaveBeenCalled();
      expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
        impotence: (answer as ErectileDysfunction) === ErectileDysfunction.Yes
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test.each([[ErectileDysfunction.Yes], [ErectileDysfunction.No]])(
    'When %s is previously selected as an answer, then it should be displayed as checked',
    (answer: string) => {
      renderComponent({
        impotence: (answer as ErectileDysfunction) === ErectileDysfunction.Yes
      } as IAboutYou);

      const radioButton: HTMLInputElement = screen.getByLabelText(answer);
      expect(radioButton).toBeChecked();
    }
  );
});
