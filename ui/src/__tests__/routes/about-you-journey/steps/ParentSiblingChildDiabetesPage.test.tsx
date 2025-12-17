import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import {
  type IAboutYou,
  ParentSiblingChildDiabetes
} from '@dnhc-health-checks/shared';
import ParentSiblingChildDiabetesPage from '../../../../routes/about-you-journey/steps/ParentSiblingChildDiabetesPage';
import { fireEvent, render, screen } from '@testing-library/react';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('ParentSiblingChildDiabetesPage', () => {
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

  afterEach(() => {});
  test('renders diabetes question', () => {
    render(
      <ParentSiblingChildDiabetesPage
        healthCheckAnswers={aboutYouMock}
        updateHealthCheckAnswers={updateHealthCheckAnswersMock}
      />
    );

    const text = screen.getByText(
      'Do you have a parent, sibling or child with diabetes?'
    );
    expect(text).toBeInTheDocument();
  });

  test('renders the error message when trying to press continue without selecting an answer', () => {
    render(
      <ParentSiblingChildDiabetesPage
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
      'Select if you have a parent, sibling or child with diabetes'
    ); // link and error
    expect(errorElements.length).toEqual(2);

    errorElements.forEach((msg) => {
      expect(msg).toBeVisible();
    });
  });

  test.each([
    [ParentSiblingChildDiabetes.Yes],
    [ParentSiblingChildDiabetes.No],
    [ParentSiblingChildDiabetes.Unknown]
  ])(
    'When %s is clicked then the radio button is checked and stores the data when submitted',
    (answer: string) => {
      render(
        <ParentSiblingChildDiabetesPage
          healthCheckAnswers={aboutYouMock}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      const radioButton: HTMLInputElement = screen.getByLabelText(
        EnumDescriptions.ParentSiblingChildDiabetes[
          answer as ParentSiblingChildDiabetes
        ]
      );
      const submitButton: HTMLInputElement = screen.getByText('Continue');

      expect(radioButton).not.toBeChecked();

      fireEvent.click(radioButton);
      fireEvent.click(submitButton);

      expect(radioButton).toBeChecked();
      expect(updateHealthCheckAnswersMock).toHaveBeenCalled();
      expect(updateHealthCheckAnswersMock).toHaveBeenCalledWith({
        hasFamilyDiabetesHistory: answer
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test.each([
    [ParentSiblingChildDiabetes.Yes],
    [ParentSiblingChildDiabetes.No],
    [ParentSiblingChildDiabetes.Unknown]
  ])(
    'When %s is previously selected as an answer, then it should be displayed as checked',
    (answer: string) => {
      render(
        <ParentSiblingChildDiabetesPage
          healthCheckAnswers={{ hasFamilyDiabetesHistory: answer } as IAboutYou}
          updateHealthCheckAnswers={updateHealthCheckAnswersMock}
        />
      );

      const radioButton: HTMLInputElement = screen.getByLabelText(
        EnumDescriptions.ParentSiblingChildDiabetes[
          answer as ParentSiblingChildDiabetes
        ]
      );
      expect(radioButton).toBeChecked();
    }
  );
});
