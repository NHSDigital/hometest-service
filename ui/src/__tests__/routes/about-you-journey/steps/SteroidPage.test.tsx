import { fireEvent, render, screen } from '@testing-library/react';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { type IAboutYou } from '@dnhc-health-checks/shared';
import SteroidPage from '../../../../routes/about-you-journey/steps/SteroidPage';

enum Steroids {
  Yes = 'Yes, I do',
  No = 'No, I do not'
}

describe('SteroidsPage', () => {
  let aboutYouMock = {} as IAboutYou;
  let updateHealthCheckAnswersMock: jest.Mock;
  let setIsPageInErrorMock: jest.Mock;

  const renderComponent = (aboutYou?: IAboutYou) =>
    render(
      <SteroidPage
        healthCheckAnswers={aboutYou ?? aboutYouMock}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );

  beforeEach(() => {
    aboutYouMock = { steroidTablets: null } as IAboutYou;

    updateHealthCheckAnswersMock = jest.fn();
    setIsPageInErrorMock = jest.fn();

    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  afterEach(() => {});

  test('renders steroid tablets question', () => {
    renderComponent();

    const text = screen.getByText('Corticosteroid tablets');

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
      'Select if you regularly take steroid tablets'
    );
    expect(errorElements.length).toEqual(2);

    errorElements.forEach((msg) => {
      expect(msg).toBeVisible();
    });
  });

  test.each([[Steroids.Yes], [Steroids.No]])(
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
        steroidTablets: (answer as Steroids) === Steroids.Yes
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test.each([[Steroids.Yes], [Steroids.No]])(
    'When %s is previously selected as an answer, then it should be displayed as checked',
    (answer: string) => {
      renderComponent({
        steroidTablets: (answer as Steroids) === Steroids.Yes
      } as IAboutYou);

      const radioButton: HTMLInputElement = screen.getByLabelText(answer);
      expect(radioButton).toBeChecked();
    }
  );
});
