import { fireEvent, render, screen } from '@testing-library/react';
import CheckYourAnswersPage from '../../../../routes/physical-activity-journey/steps/CheckYourAnswersPage';
import {
  ExerciseHours,
  type IPhysicalActivity,
  WalkingPace,
  WorkActivity,
  AuditEventType,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../../../../lib/components/event-audit-button');

describe('CheckYourAnswersPage tests', () => {
  const healthCheck: IHealthCheck = {
    id: '12345',
    dataModelVersion: '1.2.3'
  } as IHealthCheck;
  const patientId = 'abcd12345';
  let physicalActivity: IPhysicalActivity;
  let submitHealthCheckAnswers: jest.Mock;

  beforeEach(() => {
    physicalActivity = {
      cycleHours: ExerciseHours.None,
      exerciseHours: ExerciseHours.LessThanOne,
      gardeningHours: ExerciseHours.BetweenOneAndThree,
      houseworkHours: ExerciseHours.ThreeHoursOrMore,
      walkHours: ExerciseHours.ThreeHoursOrMore,
      walkPace: WalkingPace.AveragePace,
      workActivity: WorkActivity.PhysicalLight
    };
    submitHealthCheckAnswers = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('When the "Save and Continue" button is clicked then should save the answers and emit an audit event', () => {
    render(
      <BrowserRouter>
        <CheckYourAnswersPage
          healthCheckAnswers={physicalActivity}
          healthCheck={healthCheck}
          patientId={patientId}
          submitAnswers={submitHealthCheckAnswers}
        />
      </BrowserRouter>
    );

    const element = screen.getByText('Save and continue');
    fireEvent.click(element);

    expect(submitHealthCheckAnswers).toHaveBeenCalled();
    expect(
      screen.getByText(
        JSON.stringify([
          {
            eventType: AuditEventType.SectionCompletePhysicalActivity,
            healthCheck,
            patientId
          }
        ])
      )
    ).toBeInTheDocument();
  });

  test('When optional fields have no values, displays "Not provided" for them', () => {
    physicalActivity = {
      cycleHours: ExerciseHours.None,
      exerciseHours: ExerciseHours.LessThanOne,
      walkHours: ExerciseHours.ThreeHoursOrMore,
      workActivity: WorkActivity.PhysicalLight,
      gardeningHours: null,
      houseworkHours: null,
      walkPace: null
    };

    render(
      <BrowserRouter>
        <CheckYourAnswersPage
          healthCheckAnswers={physicalActivity}
          healthCheck={healthCheck}
          patientId={patientId}
          submitAnswers={submitHealthCheckAnswers}
        />
      </BrowserRouter>
    );

    const optionalFields = screen.getAllByText('Not provided');
    expect(optionalFields.length == 3).toBeTruthy();

    const element = screen.getByText('Save and continue');
    fireEvent.click(element);

    expect(submitHealthCheckAnswers).toHaveBeenCalled();
  });
});
