import { fireEvent, render, screen } from '@testing-library/react';
import { type IAboutYou } from '@dnhc-health-checks/shared';
import TownsendPostcodePage from '../../../../routes/about-you-journey/steps/TownsendPostcodePage';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';

describe('TownsendPostcodePage tests', () => {
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

  test.each([['AB1 1AB'], ['B7 8DE'], ['b7 8de']])(
    'When "%s" is filled in then should validate and proceed to next page',
    (answer: string) => {
      render(
        <TownsendPostcodePage
          healthCheckAnswers={aboutYou}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const element = screen.getByRole('textbox');
      fireEvent.change(element, { target: { value: answer } });

      const continueElement = screen.getByText('Continue');
      fireEvent.click(continueElement);
      expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
        postcode: answer.toUpperCase()
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test('When the field is left empty should proceed to the next page', () => {
    render(
      <TownsendPostcodePage
        healthCheckAnswers={aboutYou}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
      />
    );

    const continueElement = screen.getByText('Continue');
    fireEvent.click(continueElement);
    expect(updateHealthCheckAnswers).toHaveBeenCalledWith({ postcode: null });
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
  });

  test.each([['wrong postcode'], ['AAB 1AB'], ['1AB 1AB'], ['A'], ['AB1 6CD']])(
    'When "%s" is filled in then should invalidate and show error message',
    (answer: string) => {
      render(
        <TownsendPostcodePage
          healthCheckAnswers={aboutYou}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const element = screen.getByRole('textbox');
      fireEvent.change(element, { target: { value: answer } });

      const continueElement = screen.getByText('Continue');
      fireEvent.click(continueElement);
      expect(updateHealthCheckAnswers).not.toHaveBeenCalled();
      expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
      expect(screen.getByText('Error:')).toBeVisible();
      const errorElements = screen.getAllByText('Enter a full UK postcode'); // link and error
      expect(errorElements.length).toEqual(2);

      errorElements.forEach((msg) => {
        expect(msg).toBeVisible();
      });
    }
  );
});
