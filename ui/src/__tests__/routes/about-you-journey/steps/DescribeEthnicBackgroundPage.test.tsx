import { fireEvent, render, screen } from '@testing-library/react';
import {
  EthnicBackground,
  EthnicBackgroundOther,
  type IAboutYou
} from '@dnhc-health-checks/shared';
import { DescribeEthnicBackgroundPage } from '../../../../routes/about-you-journey/steps/DescribeEthnicBackgroundPage';
import { usePageTitleContext } from '../../../../lib/contexts/PageTitleContext';
import { EnumDescriptions } from '../../../../lib/models/enum-descriptions';

describe('DescribeEthnicBackgroundPage tests', () => {
  let aboutYou = {} as IAboutYou;
  let updateHealthCheckAnswers: jest.Mock;
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
    aboutYou = { ethnicBackground: EthnicBackground.Other } as IAboutYou;
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
    [
      EthnicBackground.AsianOrAsianBritish,
      Object.values(EnumDescriptions.DetailedEthnicGroup.AsianOrAsianBritish)
    ],
    [
      EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
      Object.values(
        EnumDescriptions.DetailedEthnicGroup.BlackAfricanCaribbeanOrBlackBritish
      )
    ],
    [
      EthnicBackground.White,
      Object.values(EnumDescriptions.DetailedEthnicGroup.White)
    ]
  ])(
    'When "%s" is selected as ethnic group, then %s should be displayed as possible answers',
    (ethnicBackground: string, answers: string[]) => {
      render(
        <DescribeEthnicBackgroundPage
          healthCheckAnswers={{ ethnicBackground } as IAboutYou}
          updateHealthCheckAnswers={updateHealthCheckAnswers}
        />
      );

      answers.forEach((answer) => {
        expect(screen.getByText(answer)).toBeInTheDocument();
      });
      expect(
        screen.getByText(
          EnumDescriptions.OtherDetailedEthnicGroup[
            EthnicBackgroundOther.PreferNotToSay
          ]
        )
      ).toBeInTheDocument();

      const headerQuestion = screen.getByText(
        `Which of the following best describes your ${EnumDescriptions.EthnicBackground[ethnicBackground as EthnicBackground]} group?`
      );
      expect(headerQuestion).toBeInTheDocument();
    }
  );

  test('When one of the radio option is clicked, should save it as answer', () => {
    render(
      <DescribeEthnicBackgroundPage
        healthCheckAnswers={{ ethnicBackground: 'White' } as IAboutYou}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
      />
    );

    const element = screen.getByText('Irish');
    fireEvent.click(element);

    const continueElement = screen.getByText('Continue');
    fireEvent.click(continueElement);

    expect(updateHealthCheckAnswers).toHaveBeenCalledWith({
      detailedEthnicGroup: 'Irish',
      ethnicBackground: 'White'
    });
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
  });

  test('When "Other ethnic group" is selected as ethnicity group, then should display simplified header question and proper answers', () => {
    render(
      <DescribeEthnicBackgroundPage
        healthCheckAnswers={aboutYou}
        updateHealthCheckAnswers={updateHealthCheckAnswers}
      />
    );

    Object.values(
      EnumDescriptions.DetailedEthnicGroup[EthnicBackground.Other]
    ).forEach((answer) => {
      expect(screen.getByText(answer)).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        EnumDescriptions.OtherDetailedEthnicGroup[
          EthnicBackgroundOther.PreferNotToSay
        ]
      )
    ).toBeInTheDocument();

    const headerQuestion = screen.getByText(
      `Which of the following best describes your ethnic group?`
    );
    expect(headerQuestion).toBeInTheDocument();
  });

  test(`When ${EthnicBackground.MixedOrMultipleGroups} is selected, then should display specific header question and proper answer`, () => {
    render(
      <DescribeEthnicBackgroundPage
        healthCheckAnswers={
          {
            ethnicBackground: EthnicBackground.MixedOrMultipleGroups
          } as IAboutYou
        }
        updateHealthCheckAnswers={updateHealthCheckAnswers}
      />
    );

    Object.values(
      EnumDescriptions.DetailedEthnicGroup.MixedOrMultipleGroups
    ).forEach((answer) => {
      expect(screen.getByText(answer)).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        EnumDescriptions.OtherDetailedEthnicGroup[
          EthnicBackgroundOther.PreferNotToSay
        ]
      )
    ).toBeInTheDocument();

    const headerQuestion = screen.getByText(
      `Which of the following best describes your ${EnumDescriptions.EthnicBackground[EthnicBackground.MixedOrMultipleGroups]}?`
    );
    expect(headerQuestion).toBeInTheDocument();
  });

  test('When continue is pressed without selecting answer, then error should be displayed', () => {
    render(
      <DescribeEthnicBackgroundPage
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
      `Select your background or 'Prefer not to say'`
    ); // link and error
    expect(errorElements.length).toEqual(2);

    errorElements.forEach((msg) => {
      expect(msg).toBeVisible();
    });
  });
});
