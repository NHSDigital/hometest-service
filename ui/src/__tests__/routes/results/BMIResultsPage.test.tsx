/* eslint-disable jest/no-conditional-expect */
/* eslint-disable testing-library/no-node-access */
/* eslint jest/expect-expect: ["warn", { "assertFunctionNames": ["expect", "testCorrectHelpDescriptionIsDisplayed"] }] */

import BMIResultsPage from '../../../routes/results/BMIResultsPage';
import { render, screen } from '@testing-library/react';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import { useHealthCheck } from '../../../hooks/healthCheckHooks';
import {
  AuditEventType,
  BmiClassification,
  EthnicBackground,
  PatientResultsDetailedOpenedPage
} from '@dnhc-health-checks/shared';
import { BmiClassificationBounds } from '../../../lib/models/bmi-classification-bounds';
import { BmiChartFigure } from 'nhsuk-tools-chart-components-react';

jest.mock('nhsuk-tools-chart-components-react', () => ({
  BmiChartFigure: jest.fn(() => (
    <div data-testid="mocked-bmi-chart-figure">Mocked BmiChartFigure</div>
  ))
}));

jest.mock('../../../hooks/healthCheckHooks');
const whiteOrOtherHelpText = '30 or more - obesity';
const restOfCategoriesHelpText = '27.5 or more - obesity';
const helpTextHeading = 'What BMI is and how it is calculated';
const usefulResourcesHeading = 'Useful resources';
const benefitsOfGainingWeight = 'Benefits of gaining weight';
const healthyWaysToGainWeight = 'Healthy ways to gain weight';
const bmiHeading = 'Your BMI is:';
const speakToYourGPHeading = 'Speak to your GP surgery:';
const pageTitle = 'Body mass index (BMI) results';

const bmiScore = 1500;

const mockTriggerAuditEvent = jest.fn();

jest.mock('../../../hooks/healthCheckHooks');
jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

afterEach(() => {
  mockTriggerAuditEvent.mockReset();
});

function getHealthCheckData(
  bmiClassification: BmiClassification,
  bmiScore: number,
  ethnicBackground: EthnicBackground,
  ageAtCompletion: number
) {
  return {
    id: '12345',
    dataModelVersion: '2.3.4',
    ageAtCompletion,
    questionnaire: {
      ethnicBackground
    },
    questionnaireScores: {
      bmiClassification,
      bmiScore
    }
  };
}

function renderPage() {
  const history = createMemoryHistory();
  return render(
    <Router location={history.location} navigator={history}>
      <BMIResultsPage />
    </Router>
  );
}

function setHealthCheckData(
  bmiClassification: BmiClassification,
  bmiScore: number,
  ethnicBackground: EthnicBackground,
  ageAtCompletion: number
) {
  (useHealthCheck as jest.Mock).mockReturnValue({
    data: getHealthCheckData(
      bmiClassification,
      bmiScore,
      ethnicBackground,
      ageAtCompletion
    ),
    isSuccess: true,
    isPending: false,
    isError: false
  });
}

function testScreenToSeeIfHeadingsArePresent(headings: string[]) {
  for (const heading of headings) {
    expect(screen.getByText(heading)).toBeInTheDocument();
  }
}

function testCorrectHelpDescriptionIsDisplayed(
  textForCorrectPage: string,
  textForDescription: string
) {
  const heading = screen.getByText(textForCorrectPage);
  expect(heading).toBeInTheDocument();
  screen.getByText(helpTextHeading).click();
  expect(screen.getByText(textForDescription)).toBeInTheDocument();
}

describe('BMIResultsPage tests', () => {
  test.each([
    {
      bmiScore: 18.5,
      bmiClassification: BmiClassification.Underweight
    },
    {
      bmiScore: 22.5,
      bmiClassification: BmiClassification.Healthy
    },
    {
      bmiScore: 27.5,
      bmiClassification: BmiClassification.Overweight
    },
    {
      bmiScore: 30,
      bmiClassification: BmiClassification.Obese1
    },
    {
      bmiScore: 32,
      bmiClassification: BmiClassification.Obese2
    },
    {
      bmiScore: 39,
      bmiClassification: BmiClassification.Obese3
    },
    {
      bmiScore: 38,
      bmiClassification: BmiClassification.Obese3,
      ethnicity: EthnicBackground.White,
      graphPresent: true
    },
    {
      bmiScore: 40,
      bmiClassification: BmiClassification.Obese3,
      graphPresent: false
    },
    {
      bmiScore: 39.9,
      bmiClassification: BmiClassification.Obese3,
      ethnicity: EthnicBackground.Other,
      graphPresent: true
    },
    {
      bmiScore: 40,
      bmiClassification: BmiClassification.Obese3,
      ethnicity: EthnicBackground.Other,
      graphPresent: false
    },
    {
      bmiScore: 37.4,
      bmiClassification: BmiClassification.Obese3,
      ethnicity: EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
      graphPresent: true
    },
    {
      bmiScore: 38,
      bmiClassification: BmiClassification.Obese3,
      ethnicity: EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
      graphPresent: false
    }
  ])(
    `The page renders bmi graph successfully with correct marker postion for BMI score %s`,
    ({ bmiScore, bmiClassification, ethnicity, graphPresent = true }) => {
      const ethnicityBackground = ethnicity ?? EthnicBackground.White;
      const age = 30;
      setHealthCheckData(bmiClassification, bmiScore, ethnicityBackground, age);

      renderPage();
      const bmiGraph = screen.queryByTestId('mocked-bmi-chart-figure');

      if (graphPresent) {
        expect(bmiGraph).toBeInTheDocument();
        expect(BmiChartFigure).toHaveBeenCalledWith(
          {
            ariaLabel:
              'Your body mass index result is shown on a chart here. A full description can be found in the text below it.',
            classificationBounds:
              BmiClassificationBounds.getClassificationBounds(
                ethnicityBackground
              ),
            bmi: bmiScore,
            legendMarkerText: 'Your reading',
            legendKeys: {
              underweight: BmiClassification.Underweight,
              healthy: BmiClassification.Healthy,
              overweight: BmiClassification.Overweight,
              obese: 'Obese'
            }
          },
          {}
        );
      } else {
        expect(bmiGraph).toBeNull();
      }
    }
  );
});
describe('Event AuditEventType PatientResultsDetailedOpened fired', () => {
  const age = 30;
  const bmiClassification = BmiClassification.Underweight;

  test(`send '${AuditEventType.PatientResultsDetailedOpened}' event when page is opened`, () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.White,
      age
    );
    renderPage();

    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      healthCheck: expect.objectContaining({
        id: '12345',
        dataModelVersion: '2.3.4'
      }),
      details: { page: PatientResultsDetailedOpenedPage.BMI }
    });
  });
});

describe('Underweight Result', () => {
  const age = 30;
  const bmiClassification = BmiClassification.Underweight;
  const underweight =
    'Your BMI is in the underweight category. This suggests you could benefit from gaining weight.';

  test('The page renders successfully with white ethnicity help description', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.White,
      age
    );
    renderPage();
    testScreenToSeeIfHeadingsArePresent([
      pageTitle,
      underweight,
      bmiHeading,
      `${bmiScore}`,
      speakToYourGPHeading,
      helpTextHeading,
      benefitsOfGainingWeight,
      healthyWaysToGainWeight,
      usefulResourcesHeading
    ]);

    screen.getByText(helpTextHeading).click();
    expect(screen.getByText(whiteOrOtherHelpText)).toBeInTheDocument();
  });

  test('The page renders successfully with other ethnicity help description which is the same as white', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.Other,
      age
    );
    renderPage();
    testCorrectHelpDescriptionIsDisplayed(underweight, whiteOrOtherHelpText);
  });

  test('The page renders successfully with different help description to white / other ethnicity', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
      age
    );
    renderPage();
    testCorrectHelpDescriptionIsDisplayed(
      underweight,
      restOfCategoriesHelpText
    );
  });
});

describe('Healthy Result', () => {
  const age = 30;
  const bmiClassification = BmiClassification.Healthy;
  const healthyScreen = 'Your BMI is in the healthy weight category.';

  test('The page renders successfully with white help description', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.White,
      age
    );
    renderPage();

    testScreenToSeeIfHeadingsArePresent([
      pageTitle,
      healthyScreen,
      bmiHeading,
      `${bmiScore}`,
      'Benefits of being a healthy weight',
      'To maintain a healthy weight:',
      'Speak to your GP surgery if:',
      usefulResourcesHeading
    ]);

    screen.getByText(helpTextHeading).click();
    expect(screen.getByText(whiteOrOtherHelpText)).toBeInTheDocument();
  });

  test('The page renders successfully with other help description which is the same as white ethnicity', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.Other,
      age
    );
    renderPage();
    testCorrectHelpDescriptionIsDisplayed(healthyScreen, whiteOrOtherHelpText);
  });

  test('The page renders successfully with different help description to white / other ethnicity', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
      age
    );
    renderPage();
    testCorrectHelpDescriptionIsDisplayed(
      healthyScreen,
      restOfCategoriesHelpText
    );
  });
});

describe('Overweight Result Under 65', () => {
  const age = 30;
  const bmiClassification = BmiClassification.Overweight;
  const overweightScreen =
    'Your BMI is in the overweight category. This suggests you could benefit from making some healthy changes.';

  test('The page renders successfully with white help description', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.White,
      age
    );
    renderPage();

    testScreenToSeeIfHeadingsArePresent([
      pageTitle,
      overweightScreen,
      bmiHeading,
      `${bmiScore}`,
      'Benefits of working towards a healthier weight range',
      'Tips to help you lose weight:',
      'Free tools and support',
      'Speak to your GP surgery if:',
      usefulResourcesHeading
    ]);

    screen.getByText(helpTextHeading).click();
    expect(screen.getByText(whiteOrOtherHelpText)).toBeInTheDocument();
  });

  test('The page renders successfully with other help description which is the same as white ethnicity', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.Other,
      age
    );
    renderPage();

    const heading = screen.getByText(overweightScreen);
    expect(heading).toBeInTheDocument();
    screen.getByText(helpTextHeading).click();
    expect(screen.getByText(whiteOrOtherHelpText)).toBeInTheDocument();

    testCorrectHelpDescriptionIsDisplayed(
      overweightScreen,
      whiteOrOtherHelpText
    );
  });

  test('The page renders successfully with different help description to white / other ethnicity', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
      age
    );
    renderPage();
    testCorrectHelpDescriptionIsDisplayed(
      overweightScreen,
      restOfCategoriesHelpText
    );
  });
});

describe('Overweight Result Over 65', () => {
  const age = 66;
  const bmiClassification = BmiClassification.Overweight;
  const overweightScreen =
    'Your BMI is in the overweight category. This suggests you could benefit from making some healthy changes.';

  test('The page renders successfully with white help description', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.White,
      age
    );
    renderPage();

    testScreenToSeeIfHeadingsArePresent([
      pageTitle,
      overweightScreen,
      bmiHeading,
      `${bmiScore}`,
      'Benefits of working towards a healthier weight range',
      'Important',
      'Speak to your GP surgery if:',
      'Free tools and support',
      usefulResourcesHeading
    ]);

    screen.getByText(helpTextHeading).click();
    expect(screen.getByText(whiteOrOtherHelpText)).toBeInTheDocument();
  });

  test('The page renders successfully with other help description which is the same as white ethnicity', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.Other,
      age
    );
    renderPage();

    const heading = screen.getByText(overweightScreen);
    expect(heading).toBeInTheDocument();
    screen.getByText(helpTextHeading).click();
    expect(screen.getByText(whiteOrOtherHelpText)).toBeInTheDocument();

    testCorrectHelpDescriptionIsDisplayed(
      overweightScreen,
      whiteOrOtherHelpText
    );
  });

  test('The page renders successfully with different help description to white / other ethnicity', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
      age
    );
    renderPage();
    testCorrectHelpDescriptionIsDisplayed(
      overweightScreen,
      restOfCategoriesHelpText
    );
  });
});

describe('Obese Result under 65', () => {
  const age = 30;
  const bmiClassification = BmiClassification.Obese1;
  const obeseScreen =
    'Your BMI is in the obesity category. This suggests you are carrying too much weight and you would benefit from making some healthy changes.';

  test('The page renders successfully with white help description', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.White,
      age
    );
    renderPage();

    testScreenToSeeIfHeadingsArePresent([
      pageTitle,
      obeseScreen,
      bmiHeading,
      `${bmiScore}`,
      'Benefits of working towards a healthier weight range',
      'Get support to lose weight safely',
      'Free weight loss services',
      'Speak to your GP surgery if:',
      usefulResourcesHeading
    ]);

    screen.getByText(helpTextHeading).click();
    expect(screen.getByText(whiteOrOtherHelpText)).toBeInTheDocument();
  });

  test('The page renders successfully with other help description which is the same as white ethnicity', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.Other,
      age
    );
    renderPage();
    testCorrectHelpDescriptionIsDisplayed(obeseScreen, whiteOrOtherHelpText);
  });

  test('The page renders successfully with different help description to white / other ethnicity', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
      age
    );
    renderPage();
    testCorrectHelpDescriptionIsDisplayed(
      obeseScreen,
      restOfCategoriesHelpText
    );
  });
});

describe('Obese Result over 65', () => {
  const age = 66;
  const bmiClassification = BmiClassification.Obese1;
  const obeseScreen =
    'Your BMI is in the obesity category. This suggests you are carrying too much weight and you would benefit from making some healthy changes.';

  test('The page renders successfully with white help description', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.White,
      age
    );
    renderPage();

    testScreenToSeeIfHeadingsArePresent([
      pageTitle,
      obeseScreen,
      bmiHeading,
      `${bmiScore}`,
      'Benefits of working towards a healthier weight range',
      'Important',
      'Speak to your GP surgery if:',
      'Free weight loss services',
      usefulResourcesHeading
    ]);

    screen.getByText(helpTextHeading).click();
    expect(screen.getByText(whiteOrOtherHelpText)).toBeInTheDocument();
  });

  test('The page renders successfully with other help description which is the same as white ethnicity', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.Other,
      age
    );
    renderPage();
    testCorrectHelpDescriptionIsDisplayed(obeseScreen, whiteOrOtherHelpText);
  });

  test('The page renders successfully with different help description to white / other ethnicity', () => {
    setHealthCheckData(
      bmiClassification,
      bmiScore,
      EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
      age
    );
    renderPage();
    testCorrectHelpDescriptionIsDisplayed(
      obeseScreen,
      restOfCategoriesHelpText
    );
  });
});
