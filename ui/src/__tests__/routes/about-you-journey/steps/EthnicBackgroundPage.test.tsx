import { fireEvent, render, screen } from '@testing-library/react';
import EthnicGroupPage from '../../../../routes/about-you-journey/steps/EthnicGroupPage';
import { EthnicBackground, type IAboutYou } from '@dnhc-health-checks/shared';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('EthnicBackgroundPage tests', () => {
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
    [EthnicBackground.White],
    [EthnicBackground.BlackAfricanCaribbeanOrBlackBritish]
  ])('When "%s" is clicked then should save it as answer', (answer: string) => {
    render(
      <EthnicGroupPage
        healthCheckAnswers={aboutYou}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
      />
    );

    const element = screen.getByText(
      EnumDescriptions.EthnicBackground[answer as EthnicBackground]
    );
    fireEvent.click(element);

    const continueElement = screen.getByText('Continue');
    fireEvent.click(continueElement);
    expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
      ethnicBackground: answer
    });
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
  });

  test.each([
    [EthnicBackground.White],
    [EthnicBackground.BlackAfricanCaribbeanOrBlackBritish]
  ])(
    'When "%s" was previously selected answer, then it should be shown as checked',
    (answer: string) => {
      render(
        <EthnicGroupPage
          healthCheckAnswers={{ ethnicBackground: answer } as IAboutYou}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const element: HTMLInputElement = screen.getByLabelText(
        EnumDescriptions.EthnicBackground[answer as EthnicBackground]
      );
      expect(element).toBeChecked();
    }
  );

  test('When continue is pressed without selecting answer, then error should be displayed', () => {
    render(
      <EthnicGroupPage
        healthCheckAnswers={aboutYou}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
      />
    );

    const continueElement = screen.getByText('Continue');
    fireEvent.click(continueElement);

    expect(screen.getByText('There is a problem')).toBeInTheDocument();
    expect(updateHealthCheckAnswers).not.toHaveBeenCalled();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
  });
});
