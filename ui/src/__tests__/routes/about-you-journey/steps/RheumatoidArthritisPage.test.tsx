import { fireEvent, render, screen } from '@testing-library/react';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { type IAboutYou } from '@dnhc-health-checks/shared';
import RheumatoidArthritisPage from '../../../../routes/about-you-journey/steps/RheumatoidArthritisPage';

enum RheumatoidArthritis {
  Yes = 'Yes, they have',
  No = 'No, they have not'
}

describe('RheumatoidArthritisPage', () => {
  let aboutYouMock = {} as IAboutYou;
  let updateHealthCheckAnswersMock: jest.Mock;
  let setIsPageInErrorMock: jest.Mock;

  const renderComponent = (aboutYou?: IAboutYou) =>
    render(
      <RheumatoidArthritisPage
        healthCheckAnswers={aboutYou ?? aboutYouMock}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );

  beforeEach(() => {
    aboutYouMock = { rheumatoidArthritis: null } as IAboutYou;

    updateHealthCheckAnswersMock = jest.fn();
    setIsPageInErrorMock = jest.fn();

    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  test('renders rheumatoid arthritis question', () => {
    renderComponent();

    const text = screen.getByText(
      'Has a healthcare professional ever diagnosed you with rheumatoid arthritis?'
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
      'Select if a healthcare professional has ever diagnosed you with rheumatoid arthritis'
    );
    expect(errorElements.length).toEqual(2);

    errorElements.forEach((msg) => {
      expect(msg).toBeVisible();
    });
  });

  test.each([[RheumatoidArthritis.Yes], [RheumatoidArthritis.No]])(
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
        rheumatoidArthritis:
          (answer as RheumatoidArthritis) === RheumatoidArthritis.Yes
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test.each([[RheumatoidArthritis.Yes], [RheumatoidArthritis.No]])(
    'When %s is previously selected as an answer, then it should be displayed as checked',
    (answer: string) => {
      renderComponent({
        rheumatoidArthritis:
          (answer as RheumatoidArthritis) === RheumatoidArthritis.Yes
      } as IAboutYou);

      const radioButton: HTMLInputElement = screen.getByLabelText(answer);
      expect(radioButton).toBeChecked();
    }
  );
});
