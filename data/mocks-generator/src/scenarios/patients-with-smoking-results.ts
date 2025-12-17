import { Smoking } from '@dnhc-health-checks/shared/model/enum/health-check-answers';
import { MockHealthCheckBuilder } from '../builders/mock-health-check-builder';
import { MockPatientBuilder } from '../builders/mock-patient-builder';
import { MockPatientGroup } from '../mock-patient-group';
import { SmokingCategory } from '@dnhc-health-checks/shared/model/enum/score-categories';

export class PatientsSmokingResultsMockPatientGroup extends MockPatientGroup {
  constructor() {
    super('patients-smoking-results');
  }

  create(): void {
    const mockHealthCheck =
      MockHealthCheckBuilder.basicHealthCheckWithResults();

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient who never smoked')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({ smoking: Smoking.Never })
            .updateQuestionnaireScores({
              smokingCategory: SmokingCategory.NeverSmoked
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient who is an ex-smoker')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({ smoking: Smoking.Quitted })
            .updateQuestionnaireScores({
              smokingCategory: SmokingCategory.ExSmoker
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient who is current smoker - 1 to 9 cigarettes per day')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({ smoking: Smoking.UpToNinePerDay })
            .updateQuestionnaireScores({
              smokingCategory: SmokingCategory.CurrentSmoker
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient who is current smoker - 10 to 19 cigarettes per day')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({ smoking: Smoking.TenToNineteenPerDay })
            .updateQuestionnaireScores({
              smokingCategory: SmokingCategory.CurrentSmoker
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle(
          'Patient who is current smoker - 20 or more cigarettes per day'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({ smoking: Smoking.TwentyOrMorePerDay })
            .updateQuestionnaireScores({
              smokingCategory: SmokingCategory.CurrentSmoker
            })
            .build()
        )
        .build()
    );
  }
}
