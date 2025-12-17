import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { type IAboutYou, EthnicBackground } from '@dnhc-health-checks/shared';
import EthnicGroupPage from '../../../../routes/about-you-journey/steps/EthnicGroupPage';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('EthnicGroupPage tests', () => {
  let aboutYou = {} as IAboutYou;
  let updateHealthCheckAnswers: jest.Mock;
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
    aboutYou = {} as IAboutYou;
    updateHealthCheckAnswers = jest.fn().mockResolvedValue(undefined);
    setIsPageInErrorMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      setIsPageInError: setIsPageInErrorMock
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const ethnicOptions = Object.values(EthnicBackground);

  test.each(ethnicOptions)(
    'When "%s" is selected and continue is clicked, it should save the answer',
    async (answer: EthnicBackground) => {
      render(
        <EthnicGroupPage
          healthCheckAnswers={aboutYou}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const radio = screen.getByLabelText(
        EnumDescriptions.EthnicBackground[answer]
      );
      fireEvent.click(radio);

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      expect(await screen.findByText('Continue')).toBeInTheDocument();
      expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
        ethnicBackground: answer
      });
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test.each(ethnicOptions)(
    'When "%s" was previously selected, it should be shown as checked',
    (answer: EthnicBackground) => {
      render(
        <EthnicGroupPage
          healthCheckAnswers={{ ethnicBackground: answer } as IAboutYou}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      const radio = screen.getByLabelText(
        EnumDescriptions.EthnicBackground[answer]
      );
      expect(radio).toBeChecked();
      expect(setIsPageInErrorMock).not.toHaveBeenCalled();
    }
  );

  test('When continue is clicked without selecting an option, error should be shown', async () => {
    render(
      <EthnicGroupPage
        healthCheckAnswers={aboutYou}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
      />
    );

    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    expect(await screen.findByText('There is a problem')).toBeInTheDocument();

    const errorElements = screen.getAllByText('Select your ethnic group');
    expect(errorElements.length).toEqual(2);
    errorElements.forEach((element) => expect(element).toBeVisible());

    expect(updateHealthCheckAnswers).not.toHaveBeenCalled();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
  });
});
