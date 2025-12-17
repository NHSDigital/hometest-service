import { fireEvent, render, screen } from '@testing-library/react';
import SexAssignedAtBirthPage from '../../../../routes/about-you-journey/steps/SexAssignedAtBirthPage';
import { type IAboutYou } from '@dnhc-health-checks/shared';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';

const sex = ['Female', 'Male'];

describe('SexAssignedAtBirthPage tests', () => {
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

  test.each(sex)(
    'When "%s" is clicked then should save it as answer',
    (answer: string) => {
      render(
        <SexAssignedAtBirthPage
          healthCheckAnswers={aboutYou}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const element = screen.getByText(answer);
      fireEvent.click(element);

      const continueElement = screen.getByText('Continue');
      fireEvent.click(continueElement);
      expect(updateHealthCheckAnswers).toHaveBeenCalledTimes(1);
      expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
        sex: answer
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test.each(sex)(
    'When "%s" was previously selected answer, then it should be shown as checked',
    (answer: string) => {
      render(
        <SexAssignedAtBirthPage
          healthCheckAnswers={{ sex: answer } as IAboutYou}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const element: HTMLInputElement = screen.getByLabelText(answer);
      expect(element).toBeChecked();
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test.each(sex)(
    'When "%s" was previously selected and changed, should set impotence to null',
    (answer: string) => {
      render(
        <SexAssignedAtBirthPage
          healthCheckAnswers={{ sex: answer } as IAboutYou}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const element: HTMLInputElement = screen.getByLabelText(answer);
      expect(element).toBeChecked();

      const otherElementText: string = sex[answer === 'Male' ? 0 : 1];
      const otherElement: HTMLInputElement =
        screen.getByLabelText(otherElementText);
      fireEvent.click(otherElement);

      const continueElement: HTMLInputElement = screen.getByText('Continue');
      fireEvent.click(continueElement);

      expect(updateHealthCheckAnswers).toHaveBeenCalledTimes(1);
      expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
        sex: otherElementText,
        impotence: null
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test('When continue is pressed without selecting answer, then error should be displayed', () => {
    render(
      <SexAssignedAtBirthPage
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
    const errorElements = screen.getAllByText(
      'Select your sex assigned at birth'
    ); // link and error
    expect(errorElements.length).toEqual(2);

    errorElements.forEach((msg) => {
      expect(msg).toBeVisible();
    });
  });
});
