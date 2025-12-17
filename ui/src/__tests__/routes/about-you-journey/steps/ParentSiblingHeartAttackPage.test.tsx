import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import {
  type IAboutYou,
  ParentSiblingHeartAttack
} from '@dnhc-health-checks/shared';
import ParentSiblingHeartAttackPage from '../../../../routes/about-you-journey/steps/ParentSiblingHeartAttackPage';
import { fireEvent, render, screen } from '@testing-library/react';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('ParentSiblingHeartAttackPage', () => {
  const updateHealthCheckAnswersMock = jest.fn();
  const aboutYouMock = {} as IAboutYou;
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
    setIsPageInErrorMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  test('renders heart attack or angina question', () => {
    render(
      <ParentSiblingHeartAttackPage
        healthCheckAnswers={aboutYouMock}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );

    const text = screen.getByText(
      'Have any of your parents or siblings had a heart attack or angina before the age of 60?'
    );
    expect(text).toBeInTheDocument();
  });

  test('renders the error message when trying to press continue without selecting an answer', () => {
    render(
      <ParentSiblingHeartAttackPage
        healthCheckAnswers={aboutYouMock}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );

    let errorMessage = screen.queryByText('There is a problem');
    expect(errorMessage).not.toBeInTheDocument();

    const submitButton: HTMLInputElement = screen.getByText('Continue');

    fireEvent.click(submitButton);

    errorMessage = screen.getByText('There is a problem');
    expect(errorMessage).toBeInTheDocument();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);

    expect(screen.getByText('Error:')).toBeVisible();
    const errorElements = screen.getAllByText(
      'Select if a parent or sibling had a heart attack or angina before 60'
    ); // link and error
    expect(errorElements.length).toEqual(2);

    errorElements.forEach((msg) => {
      expect(msg).toBeVisible();
    });
  });

  test.each([
    [ParentSiblingHeartAttack.Yes],
    [ParentSiblingHeartAttack.No],
    [ParentSiblingHeartAttack.Unknown]
  ])(
    'When %s is clicked then the radio button is checked and stores the data when submitted',
    (answer: string) => {
      render(
        <ParentSiblingHeartAttackPage
          healthCheckAnswers={aboutYouMock}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      const radioButton: HTMLInputElement = screen.getByLabelText(
        EnumDescriptions.ParentSiblingHeartAttack[
          answer as ParentSiblingHeartAttack
        ]
      );
      const submitButton: HTMLInputElement = screen.getByText('Continue');

      expect(radioButton).not.toBeChecked();

      fireEvent.click(radioButton);
      fireEvent.click(submitButton);

      expect(radioButton).toBeChecked();
      expect(updateHealthCheckAnswersMock).toHaveBeenCalled();
      expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
        hasFamilyHeartAttackHistory: answer
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test.each([
    [ParentSiblingHeartAttack.Yes],
    [ParentSiblingHeartAttack.No],
    [ParentSiblingHeartAttack.Unknown]
  ])(
    'When %s is previously selected as an answer, then it should be displayed as checked',
    (answer: string) => {
      render(
        <ParentSiblingHeartAttackPage
          healthCheckAnswers={
            { hasFamilyHeartAttackHistory: answer } as IAboutYou
          }
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      const radioButton: HTMLInputElement = screen.getByLabelText(
        EnumDescriptions.ParentSiblingHeartAttack[
          answer as ParentSiblingHeartAttack
        ]
      );
      expect(radioButton).toBeChecked();
    }
  );
});
