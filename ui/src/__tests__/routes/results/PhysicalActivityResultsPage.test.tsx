/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { render, screen } from '@testing-library/react';
import PhysicalActivityResultsPage from '../../../routes/results/PhysicalActivityResultsPage';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import {
  AuditEventType,
  ActivityCategory,
  BloodPressureLocation,
  EthnicBackground,
  ExerciseHours,
  Smoking,
  HealthCheckSteps,
  PatientResultsDetailedOpenedPage
} from '@dnhc-health-checks/shared';
import { useHealthCheck } from '../../../hooks/healthCheckHooks';
import { type PhysicalActivityResultsPageBase } from '../../../routes/results/physical-activity/PhysicalActivityResultsPageBase';
import {
  PhysicalActivityInactive3HourOrMoreWalkingPage,
  PhysicalActivityInactiveBelow1HourWalkingPage,
  PhysicalActivityInactiveBetween1And3HoursWalkingPage,
  PhysicalActivityInactiveNoWalkingPage
} from '../../../routes/results/physical-activity/PhysicalActivityInactivePage';
import {
  PhysicalActivityModeratelyInactive3HourOrMoreWalkingPage,
  PhysicalActivityModeratelyInactiveBelow1HourWalkingPage,
  PhysicalActivityModeratelyInactiveBetween1And3HoursWalkingPage,
  PhysicalActivityModeratelyInactiveNoWalkingPage
} from '../../../routes/results/physical-activity/PhysicalActivityModeratelyInactivePage';
import { PhysicalActivityModeratelyActivePage } from '../../../routes/results/physical-activity/PhysicalActivityModeratelyActivePage';
import { PhysicalActivityActivePage } from '../../../routes/results/physical-activity/PhysicalActivityActivePage';
import { EnumDescriptions } from '../../../lib/models/enum-descriptions';

jest.mock('../../../hooks/healthCheckHooks');
const mockTriggerAuditEvent = jest.fn();

jest.mock('../../../hooks/eventAuditHook', () => ({
  useAuditEvent: () => {
    return {
      triggerAuditEvent: mockTriggerAuditEvent
    };
  }
}));

const healthCheckData = {
  questionnaire: {
    bloodPressureDiastolic: 80,
    bloodPressureLocation: BloodPressureLocation.Monitor,
    bloodPressureSystolic: 120,
    cycleHours: ExerciseHours.ThreeHoursOrMore,
    detailedEthnicGroup: 'Bangladeshi',
    drinkAlcohol: 'Never',
    ethnicBackground: EthnicBackground.AsianOrAsianBritish,
    exerciseHours: ExerciseHours.LessThanOne,
    gardeningHours: ExerciseHours.LessThanOne,
    hasCompletedHealthCheckInLast5Years: false,
    hasFamilyHeartAttackHistory: 'No',
    hasPreExistingCondition: false,
    height: 190,
    heightDisplayPreference: 'cm',
    houseworkHours: ExerciseHours.BetweenOneAndThree,
    sex: 'Male',
    smoking: Smoking.Never,
    walkHours: ExerciseHours.BetweenOneAndThree,
    walkPace: 'BriskPace',
    weight: 90,
    weightDisplayPreference: 'kg',
    workActivity: 'Sitting'
  },
  questionnaireScores: {
    activityCategory: ActivityCategory.ModeratelyActive,
    auditCategory: 'No Risk',
    auditScore: 0,
    bmiClassification: 'Overweight',
    bmiScore: 27.6,
    gppaqScore: 4,
    townsendScore: null,
    bloodPressureCategory: 'High'
  },
  riskScores: {
    heartAge: 84,
    qRiskScore: 32,
    qRiskScoreCategory: 'High',
    scoreCalculationDate: '2024-08-13T09:04:53.804Z'
  },
  id: '12345',
  dataModelVersion: '2.3.4',
  step: HealthCheckSteps.GP_UPDATE_SUCCESS
};

afterEach(() => {
  mockTriggerAuditEvent.mockReset();
});

function ensureRequiredHeadingsArePresent(headings: string[]) {
  for (const heading of headings) {
    expect(screen.getByText(heading)).toBeInTheDocument();
  }
}

describe('PhysicalActivityResultsPage tests', () => {
  test.each([
    [
      ActivityCategory.Inactive,
      ExerciseHours.None,
      new PhysicalActivityInactiveNoWalkingPage(),
      [
        'Start small and build up',
        'What are moderate and vigorous activities?',
        'Try a 10 minute walk',
        'What can I do next?'
      ]
    ],
    [
      ActivityCategory.Inactive,
      ExerciseHours.LessThanOne,
      new PhysicalActivityInactiveBelow1HourWalkingPage(),
      [
        'Start small and build up',
        'What are moderate and vigorous activities?',
        'Keep on walking',
        'What can I do next?'
      ]
    ],
    [
      ActivityCategory.Inactive,
      ExerciseHours.BetweenOneAndThree,
      new PhysicalActivityInactiveBetween1And3HoursWalkingPage(),
      [
        'Start small and build up',
        'What are moderate and vigorous activities?',
        'Keep on walking',
        'What can I do next?'
      ]
    ],
    [
      ActivityCategory.Inactive,
      ExerciseHours.ThreeHoursOrMore,
      new PhysicalActivityInactive3HourOrMoreWalkingPage(),
      [
        'Keep on walking',
        'Get moving more',
        'What are moderate and vigorous activities?',
        'What can I do next?'
      ]
    ],
    [
      ActivityCategory.ModeratelyInactive,
      ExerciseHours.None,
      new PhysicalActivityModeratelyInactiveNoWalkingPage(),
      [
        'Get moving more',
        'What are moderate and vigorous activities?',
        'Try a 10 minute walk',
        'What can I do next?'
      ]
    ],
    [
      ActivityCategory.ModeratelyInactive,
      ExerciseHours.LessThanOne,
      new PhysicalActivityModeratelyInactiveBelow1HourWalkingPage(),
      [
        'Get moving more',
        'What are moderate and vigorous activities?',
        'Keep on walking',
        'What can I do next?'
      ]
    ],
    [
      ActivityCategory.ModeratelyInactive,
      ExerciseHours.BetweenOneAndThree,
      new PhysicalActivityModeratelyInactiveBetween1And3HoursWalkingPage(),
      [
        'Get moving more',
        'What are moderate and vigorous activities?',
        'Keep on walking',
        'What can I do next?'
      ]
    ],
    [
      ActivityCategory.ModeratelyInactive,
      ExerciseHours.ThreeHoursOrMore,
      new PhysicalActivityModeratelyInactive3HourOrMoreWalkingPage(),
      [
        'Get moving more',
        'What are moderate and vigorous activities?',
        'Keep on walking',
        'What can I do next?'
      ]
    ],
    [
      ActivityCategory.ModeratelyActive,
      ExerciseHours.ThreeHoursOrMore,
      new PhysicalActivityModeratelyActivePage(),
      [
        'Stay active every day',
        'What are moderate and vigorous activities?',
        'Do'
      ]
    ],
    [
      ActivityCategory.Active,
      ExerciseHours.ThreeHoursOrMore,
      new PhysicalActivityActivePage(),
      [
        'Benefits of being active',
        'What are moderate and vigorous activities?',
        'Do'
      ]
    ]
  ])(
    `Should render page for category %s and walking hours %s`,
    (
      activityCategory: ActivityCategory,
      walkHours: ExerciseHours,
      expectedPage: PhysicalActivityResultsPageBase,
      pageVariantHeadings: string[]
    ) => {
      const healthCheck = healthCheckData;
      Object.assign(healthCheck.questionnaireScores, {
        activityCategory
      });
      Object.assign(healthCheck.questionnaire, { walkHours });

      (useHealthCheck as jest.Mock).mockReturnValue({
        data: healthCheck,
        isSuccess: true,
        isPending: false,
        isError: false
      });
      const history = createMemoryHistory();

      const { container } = render(
        <Router location={history.location} navigator={history}>
          <PhysicalActivityResultsPage />
        </Router>
      );

      const commonHeadings = [
        'Physical activity results',
        `Your physical activity level is ${EnumDescriptions.ActivityCategory[activityCategory].toLowerCase()}`,
        expectedPage.riskLevelDescription,
        'How is my physical activity level calculated?',
        'Activities for people with disabilities',
        'Useful resources'
      ];
      ensureRequiredHeadingsArePresent(commonHeadings);
      ensureRequiredHeadingsArePresent(pageVariantHeadings);

      expect(
        container
          .querySelector('#risk-level-description')
          ?.classList.contains(expectedPage.riskLevelColor)
      ).toBeTruthy();
    }
  );

  test(`send '${AuditEventType.PatientResultsDetailedOpened}' event when page is rendered`, () => {
    const history = createMemoryHistory();
    render(
      <Router location={history.location} navigator={history}>
        <PhysicalActivityResultsPage />
      </Router>
    );

    expect(mockTriggerAuditEvent).toHaveBeenCalledWith({
      eventType: AuditEventType.PatientResultsDetailedOpened,
      details: { page: PatientResultsDetailedOpenedPage.PhysicalActivity },
      healthCheck: expect.objectContaining({
        id: '12345',
        dataModelVersion: '2.3.4'
      })
    });
  });

  test('throw error when the category is not one of the known ones', () => {
    const healthCheck = healthCheckData;
    Object.assign(healthCheck.questionnaireScores, {
      activityCategory: 'Unknown'
    });
    (useHealthCheck as jest.Mock).mockReturnValue({
      data: healthCheck,
      isSuccess: true,
      isPending: false,
      isError: false
    });
    const history = createMemoryHistory();
    const renderPage = () => {
      render(
        <Router location={history.location} navigator={history}>
          <PhysicalActivityResultsPage />
        </Router>
      );
    };

    expect(renderPage).toThrow('Unhandled activity category: Unknown');
  });
});
