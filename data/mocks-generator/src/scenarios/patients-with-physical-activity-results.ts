import {
  ExerciseHours,
  WalkingPace,
  WorkActivity
} from '@dnhc-health-checks/shared/model/enum/health-check-answers';
import { MockHealthCheckBuilder } from '../builders/mock-health-check-builder';
import { MockPatientBuilder } from '../builders/mock-patient-builder';
import { MockPatientGroup } from '../mock-patient-group';
import { ActivityCategory } from '@dnhc-health-checks/shared/model/enum/score-categories';

export class PatientsWithPhysicalActivityResultsMockPatientGroup extends MockPatientGroup {
  constructor() {
    super('patients-with-physical-activity-results');
  }

  create(): void {
    const mockHealthCheck =
      MockHealthCheckBuilder.basicHealthCheckWithResults();

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Inactive patient - no walking')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              cycleHours: ExerciseHours.None,
              exerciseHours: ExerciseHours.None,
              gardeningHours: ExerciseHours.None,
              houseworkHours: ExerciseHours.None,
              walkHours: ExerciseHours.None,
              walkPace: WalkingPace.SlowPace,
              workActivity: WorkActivity.Sitting
            })
            .updateQuestionnaireScores({
              activityCategory: ActivityCategory.Inactive
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Inactive patient - less than 1 hour walking')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              cycleHours: ExerciseHours.None,
              exerciseHours: ExerciseHours.None,
              gardeningHours: ExerciseHours.None,
              houseworkHours: ExerciseHours.None,
              walkHours: ExerciseHours.LessThanOne,
              walkPace: WalkingPace.SlowPace,
              workActivity: WorkActivity.Sitting
            })
            .updateQuestionnaireScores({
              activityCategory: ActivityCategory.Inactive
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Inactive patient - more than 1 hour but less than 3')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              cycleHours: ExerciseHours.ThreeHoursOrMore,
              exerciseHours: ExerciseHours.LessThanOne,
              gardeningHours: ExerciseHours.None,
              houseworkHours: ExerciseHours.LessThanOne,
              walkHours: ExerciseHours.BetweenOneAndThree,
              walkPace: WalkingPace.SlowPace,
              workActivity: WorkActivity.PhysicalLight
            })
            .updateQuestionnaireScores({
              activityCategory: ActivityCategory.Inactive
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Inactive patient - 3 hours or more')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              cycleHours: ExerciseHours.ThreeHoursOrMore,
              exerciseHours: ExerciseHours.LessThanOne,
              gardeningHours: ExerciseHours.None,
              houseworkHours: ExerciseHours.ThreeHoursOrMore,
              walkHours: ExerciseHours.ThreeHoursOrMore,
              walkPace: WalkingPace.SlowPace,
              workActivity: WorkActivity.PhysicalLight
            })
            .updateQuestionnaireScores({
              activityCategory: ActivityCategory.Inactive
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Moderately inactive patient - no walking')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              cycleHours: ExerciseHours.ThreeHoursOrMore,
              exerciseHours: ExerciseHours.LessThanOne,
              gardeningHours: ExerciseHours.None,
              houseworkHours: ExerciseHours.ThreeHoursOrMore,
              walkHours: ExerciseHours.None,
              walkPace: WalkingPace.SlowPace,
              workActivity: WorkActivity.PhysicalLight
            })
            .updateQuestionnaireScores({
              activityCategory: ActivityCategory.ModeratelyInactive
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Moderately inactive patient - less than 1 hour walking')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              cycleHours: ExerciseHours.ThreeHoursOrMore,
              exerciseHours: ExerciseHours.LessThanOne,
              gardeningHours: ExerciseHours.None,
              houseworkHours: ExerciseHours.ThreeHoursOrMore,
              walkHours: ExerciseHours.LessThanOne,
              walkPace: WalkingPace.SlowPace,
              workActivity: WorkActivity.PhysicalLight
            })
            .updateQuestionnaireScores({
              activityCategory: ActivityCategory.ModeratelyInactive
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Moderately inactive patient - more than 1 hour but less than 3'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              cycleHours: ExerciseHours.ThreeHoursOrMore,
              exerciseHours: ExerciseHours.LessThanOne,
              gardeningHours: ExerciseHours.None,
              houseworkHours: ExerciseHours.ThreeHoursOrMore,
              walkHours: ExerciseHours.BetweenOneAndThree,
              walkPace: WalkingPace.SlowPace,
              workActivity: WorkActivity.PhysicalLight
            })
            .updateQuestionnaireScores({
              activityCategory: ActivityCategory.ModeratelyInactive
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Moderately inactive patient - 3 hours or more')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              cycleHours: ExerciseHours.ThreeHoursOrMore,
              exerciseHours: ExerciseHours.LessThanOne,
              gardeningHours: ExerciseHours.None,
              houseworkHours: ExerciseHours.ThreeHoursOrMore,
              walkHours: ExerciseHours.ThreeHoursOrMore,
              walkPace: WalkingPace.SlowPace,
              workActivity: WorkActivity.PhysicalLight
            })
            .updateQuestionnaireScores({
              activityCategory: ActivityCategory.ModeratelyInactive
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Moderately active patient')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              cycleHours: ExerciseHours.ThreeHoursOrMore,
              exerciseHours: ExerciseHours.LessThanOne,
              gardeningHours: ExerciseHours.None,
              houseworkHours: ExerciseHours.ThreeHoursOrMore,
              walkHours: ExerciseHours.ThreeHoursOrMore,
              walkPace: WalkingPace.SlowPace,
              workActivity: WorkActivity.PhysicalLight
            })
            .updateQuestionnaireScores({
              activityCategory: ActivityCategory.ModeratelyActive
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Active patient')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              cycleHours: ExerciseHours.ThreeHoursOrMore,
              exerciseHours: ExerciseHours.LessThanOne,
              gardeningHours: ExerciseHours.None,
              houseworkHours: ExerciseHours.ThreeHoursOrMore,
              walkHours: ExerciseHours.ThreeHoursOrMore,
              walkPace: WalkingPace.SlowPace,
              workActivity: WorkActivity.PhysicalLight
            })
            .updateQuestionnaireScores({
              activityCategory: ActivityCategory.Active
            })
            .build()
        )
        .build()
    );
  }
}
