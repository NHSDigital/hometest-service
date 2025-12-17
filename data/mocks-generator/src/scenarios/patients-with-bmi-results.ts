import {
  BlackAfricanCaribbeanOrBlackBritish,
  EthnicBackground,
  HeightDisplayPreference,
  WaistMeasurementDisplayPreference,
  WeightDisplayPreference,
  WhiteEthnicBackground
} from '@dnhc-health-checks/shared/model/enum/health-check-answers';
import { MockHealthCheckBuilder } from '../builders/mock-health-check-builder';
import { MockPatientBuilder } from '../builders/mock-patient-builder';
import { MockPatientGroup } from '../mock-patient-group';
import { BmiClassification } from '@dnhc-health-checks/shared/model/enum/score-categories';

export class PatientsWithBmiResultsMockPatientGroup extends MockPatientGroup {
  constructor() {
    super('patients-with-bmi-results');
  }

  create(): void {
    const mockHealthCheck =
      MockHealthCheckBuilder.basicHealthCheckWithResults();

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with underweight BMI results')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              detailedEthnicGroup:
                WhiteEthnicBackground.EnglishWelshScottishNIBritish,
              ethnicBackground: EthnicBackground.White,
              waistMeasurement: 200,
              waistMeasurementDisplayPreference:
                WaistMeasurementDisplayPreference.Centimetres,
              height: 180,
              heightDisplayPreference: HeightDisplayPreference.Centimetres,
              weight: 55,
              weightDisplayPreference: WeightDisplayPreference.Kilograms
            })
            .updateQuestionnaireScores({
              bmiScore: 17,
              bmiClassification: BmiClassification.Underweight
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with healthy BMI results - other ethnic')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              detailedEthnicGroup:
                BlackAfricanCaribbeanOrBlackBritish.Caribbean,
              ethnicBackground:
                EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
              waistMeasurement: 200,
              waistMeasurementDisplayPreference:
                WaistMeasurementDisplayPreference.Centimetres,
              height: 180,
              heightDisplayPreference: HeightDisplayPreference.Centimetres,
              weight: 74,
              weightDisplayPreference: WeightDisplayPreference.Kilograms
            })
            .updateQuestionnaireScores({
              bmiScore: 22.8,
              bmiClassification: BmiClassification.Healthy
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setAge('60')
        .setTitle(
          'Patient with overweight BMI results - under age 65 - other ethnic'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              detailedEthnicGroup:
                BlackAfricanCaribbeanOrBlackBritish.Caribbean,
              ethnicBackground:
                EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
              waistMeasurement: 200,
              waistMeasurementDisplayPreference:
                WaistMeasurementDisplayPreference.Centimetres,
              height: 180,
              heightDisplayPreference: HeightDisplayPreference.Centimetres,
              weight: 88.8,
              weightDisplayPreference: WeightDisplayPreference.Kilograms
            })
            .updateQuestionnaireScores({
              bmiScore: 27.4,
              bmiClassification: BmiClassification.Overweight
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setAge('70')
        .setTitle(
          'Patient with overweight BMI results - over 65 age - other ethnic'
        )
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              detailedEthnicGroup:
                BlackAfricanCaribbeanOrBlackBritish.Caribbean,
              ethnicBackground:
                EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
              waistMeasurement: 200,
              waistMeasurementDisplayPreference:
                WaistMeasurementDisplayPreference.Centimetres,
              height: 180,
              heightDisplayPreference: HeightDisplayPreference.Centimetres,
              weight: 90,
              weightDisplayPreference: WeightDisplayPreference.Kilograms
            })
            .updateQuestionnaireScores({
              bmiScore: 25,
              bmiClassification: BmiClassification.Overweight
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with obese1 BMI results - under 65')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              detailedEthnicGroup:
                BlackAfricanCaribbeanOrBlackBritish.Caribbean,
              ethnicBackground:
                EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
              waistMeasurement: 200,
              waistMeasurementDisplayPreference:
                WaistMeasurementDisplayPreference.Centimetres,
              height: 180,
              heightDisplayPreference: HeightDisplayPreference.Centimetres,
              weight: 90,
              weightDisplayPreference: WeightDisplayPreference.Kilograms
            })
            .updateQuestionnaireScores({
              bmiScore: 32,
              bmiClassification: BmiClassification.Obese1
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with obese2 BMI results - under 65')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              detailedEthnicGroup:
                BlackAfricanCaribbeanOrBlackBritish.Caribbean,
              ethnicBackground:
                EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
              waistMeasurement: 200,
              waistMeasurementDisplayPreference:
                WaistMeasurementDisplayPreference.Centimetres,
              height: 180,
              heightDisplayPreference: HeightDisplayPreference.Centimetres,
              weight: 90,
              weightDisplayPreference: WeightDisplayPreference.Kilograms
            })
            .updateQuestionnaireScores({
              bmiScore: 27.5,
              bmiClassification: BmiClassification.Obese2
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with obese3 BMI results - under 65')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              detailedEthnicGroup:
                BlackAfricanCaribbeanOrBlackBritish.Caribbean,
              ethnicBackground:
                EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
              waistMeasurement: 200,
              waistMeasurementDisplayPreference:
                WaistMeasurementDisplayPreference.Centimetres,
              height: 180,
              heightDisplayPreference: HeightDisplayPreference.Centimetres,
              weight: 90,
              weightDisplayPreference: WeightDisplayPreference.Kilograms
            })
            .updateQuestionnaireScores({
              bmiScore: 27.5,
              bmiClassification: BmiClassification.Obese3
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with obese1 BMI results - over 65')
        .setAge('70')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              detailedEthnicGroup:
                BlackAfricanCaribbeanOrBlackBritish.Caribbean,
              ethnicBackground:
                EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
              waistMeasurement: 200,
              waistMeasurementDisplayPreference:
                WaistMeasurementDisplayPreference.Centimetres,
              height: 180,
              heightDisplayPreference: HeightDisplayPreference.Centimetres,
              weight: 90,
              weightDisplayPreference: WeightDisplayPreference.Kilograms
            })
            .updateQuestionnaireScores({
              bmiScore: 32,
              bmiClassification: BmiClassification.Obese1
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with obese2 BMI results - over 65')
        .setAge('70')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              detailedEthnicGroup:
                BlackAfricanCaribbeanOrBlackBritish.Caribbean,
              ethnicBackground:
                EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
              waistMeasurement: 200,
              waistMeasurementDisplayPreference:
                WaistMeasurementDisplayPreference.Centimetres,
              height: 180,
              heightDisplayPreference: HeightDisplayPreference.Centimetres,
              weight: 90,
              weightDisplayPreference: WeightDisplayPreference.Kilograms
            })
            .updateQuestionnaireScores({
              bmiScore: 27.5,
              bmiClassification: BmiClassification.Obese2
            })
            .build()
        )
        .build()
    );

    this.addPatient(
      MockPatientBuilder.basicEligiblePatient()
        .setTitle('Patient with obese3 BMI results - over 65')
        .setAge('70')
        .addHealthCheck(
          mockHealthCheck
            .clone()
            .updateQuestionnaire({
              detailedEthnicGroup:
                BlackAfricanCaribbeanOrBlackBritish.Caribbean,
              ethnicBackground:
                EthnicBackground.BlackAfricanCaribbeanOrBlackBritish,
              waistMeasurement: 200,
              waistMeasurementDisplayPreference:
                WaistMeasurementDisplayPreference.Centimetres,
              height: 180,
              heightDisplayPreference: HeightDisplayPreference.Centimetres,
              weight: 90,
              weightDisplayPreference: WeightDisplayPreference.Kilograms
            })
            .updateQuestionnaireScores({
              bmiScore: 27.5,
              bmiClassification: BmiClassification.Obese3
            })
            .build()
        )
        .build()
    );
  }
}
