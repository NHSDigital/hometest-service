import { fireEvent, render, screen } from '@testing-library/react';
import SmokingQuestionPage from '../../../../routes/about-you-journey/steps/SmokingQuestionPage';
import { Smoking, type IAboutYou } from '@dnhc-health-checks/shared';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('SmokingQuestionPage tests', () => {
  let aboutYou = {} as IAboutYou;
  let updateHealthCheckAnswers: jest.Mock;
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
    aboutYou = {} as IAboutYou;
    updateHealthCheckAnswers = jest.fn();
    setIsPageInErrorMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test.each([
    [Smoking.TenToNineteenPerDay],
    [Smoking.TwentyOrMorePerDay],
    [Smoking.Never],
    [Smoking.Quitted],
    [Smoking.UpToNinePerDay]
  ])('When "%s" is clicked then should save it as answer', (answer: string) => {
    render(
      <SmokingQuestionPage
        healthCheckAnswers={aboutYou}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
      />
    );

    const element = screen.getByText(
      EnumDescriptions.Smoking[answer as Smoking].description
    );
    fireEvent.click(element);

    const continueElement = screen.getByText('Continue');
    fireEvent.click(continueElement);
    expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
      smoking: answer
    });
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
  });

  test.each([
    [Smoking.TenToNineteenPerDay],
    [Smoking.TwentyOrMorePerDay],
    [Smoking.Never],
    [Smoking.Quitted],
    [Smoking.UpToNinePerDay]
  ])(
    'When "%s" was previously selected answer, then it should be shown as checked',
    (answer: string) => {
      render(
        <SmokingQuestionPage
          healthCheckAnswers={{ smoking: answer } as IAboutYou}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const element: HTMLInputElement = screen.getByLabelText(
        EnumDescriptions.Smoking[answer as Smoking].description
      );
      expect(element).toBeChecked();
    }
  );

  test('When continue is pressed without selecting answer, then error should be displayed', () => {
    render(
      <SmokingQuestionPage
        healthCheckAnswers={aboutYou}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
      />
    );

    const continueElement = screen.getByText('Continue');
    fireEvent.click(continueElement);

    expect(screen.getByText('There is a problem')).toBeInTheDocument();
    expect(updateHealthCheckAnswers).not.toHaveBeenCalled();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);

    expect(screen.getByText('Error:')).toBeVisible();
    const errorElements = screen.getAllByText('Select if you smoke'); // link and error
    expect(errorElements.length).toEqual(2);

    errorElements.forEach((msg) => {
      expect(msg).toBeVisible();
    });
  });
});
