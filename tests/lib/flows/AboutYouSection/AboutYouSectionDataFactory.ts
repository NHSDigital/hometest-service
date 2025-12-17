import {
  AntipsychoticMedication,
  AsianOrAsianBritish,
  type BlackAfricanCaribbeanOrBlackBritish,
  EthnicBackground,
  EthnicBackgroundOther,
  Lupus,
  Migraines,
  type MixedOrMultipleGroups,
  type OtherEthnicity,
  ParentSiblingChildDiabetes,
  ParentSiblingHeartAttack,
  SevereMentalIllness,
  Sex,
  Smoking,
  WhiteEthnicBackground,
  Impotence,
  SteroidTablets,
  RheumatoidArthritis
} from '@dnhc-health-checks/shared';

export interface AboutYouSectionDataFlow {
  townsendPostcode: string | null;
  familyHeartAttackHistory: ParentSiblingHeartAttack;
  familyDiabetesHistory: ParentSiblingChildDiabetes;
  sexAssignedAtBirth: Sex;
  ethnicGroup: EthnicBackground;
  detailedEthnicGroupAsian?: AsianOrAsianBritish | EthnicBackgroundOther;
  detailedEthnicGroupBlack?:
    | BlackAfricanCaribbeanOrBlackBritish
    | EthnicBackgroundOther;
  detailedEthnicGroupMixedEthnic?:
    | MixedOrMultipleGroups
    | EthnicBackgroundOther;
  detailedEthnicGroupWhite?: WhiteEthnicBackground | EthnicBackgroundOther;
  detailedOtherEthnicGroup?: OtherEthnicity | EthnicBackgroundOther;
  doYouSmoke: Smoking;
  lupus: Lupus;
  severeMentalIllness: SevereMentalIllness;
  antipsychoticMedication: AntipsychoticMedication;
  migraines: Migraines;
  erectileDysfunction?: Impotence;
  steroid: SteroidTablets;
  rheumatoidArthritis: RheumatoidArthritis;
}

export enum AboutYouSectionDataType {
  NON_SMOKING_HEALTHY_OTHER_ETHNIC_MALE = 'NON_SMOKING_HEALTHY_ASIAN_MALE',
  NON_SMOKING_HEALTHY_WHITE_FEMALE = 'NON_SMOKING_HEALTHY_WHITE_FEMALE',
  ASIAN_MALE_NO_SMOKING_WITHOUT_HEALTH_ISSUES = 'ASIAN_MALE_NO_SMOKING_WITHOUT_HEALTH_ISSUES',
  HIGH_RISK_ASIAN_MALE = 'HIGH_RISK_ASIAN_MALE',
  MEDIUM_RISK_WHITE_MALE = 'MEDIUM_RISK_WHITE_MALE'
}

export class AboutYouSectionDataFactory {
  readonly dataType: AboutYouSectionDataType;

  constructor(dataType: AboutYouSectionDataType) {
    this.dataType = dataType;
  }

  public getData(): AboutYouSectionDataFlow {
    switch (this.dataType) {
      case AboutYouSectionDataType.NON_SMOKING_HEALTHY_OTHER_ETHNIC_MALE:
        return {
          townsendPostcode: 'E1 8RD',
          familyHeartAttackHistory: ParentSiblingHeartAttack.No,
          familyDiabetesHistory: ParentSiblingChildDiabetes.No,
          sexAssignedAtBirth: Sex.Male,
          ethnicGroup: EthnicBackground.Other,
          detailedOtherEthnicGroup: EthnicBackgroundOther.PreferNotToSay,
          doYouSmoke: Smoking.Never,
          lupus: Lupus.No,
          severeMentalIllness: SevereMentalIllness.No,
          antipsychoticMedication: AntipsychoticMedication.No,
          migraines: Migraines.No,
          erectileDysfunction: Impotence.No,
          steroid: SteroidTablets.No,
          rheumatoidArthritis: RheumatoidArthritis.No
        };

      case AboutYouSectionDataType.NON_SMOKING_HEALTHY_WHITE_FEMALE:
        return {
          townsendPostcode: 'FY83SY',
          familyHeartAttackHistory: ParentSiblingHeartAttack.No,
          familyDiabetesHistory: ParentSiblingChildDiabetes.No,
          sexAssignedAtBirth: Sex.Female,
          ethnicGroup: EthnicBackground.White,
          detailedEthnicGroupWhite:
            WhiteEthnicBackground.EnglishWelshScottishNIBritish,
          doYouSmoke: Smoking.Never,
          lupus: Lupus.No,
          severeMentalIllness: SevereMentalIllness.No,
          antipsychoticMedication: AntipsychoticMedication.No,
          migraines: Migraines.No,
          steroid: SteroidTablets.No,
          rheumatoidArthritis: RheumatoidArthritis.No
        };

      case AboutYouSectionDataType.ASIAN_MALE_NO_SMOKING_WITHOUT_HEALTH_ISSUES:
        return {
          townsendPostcode: null,
          familyHeartAttackHistory: ParentSiblingHeartAttack.No,
          familyDiabetesHistory: ParentSiblingChildDiabetes.No,
          sexAssignedAtBirth: Sex.Male,
          ethnicGroup: EthnicBackground.AsianOrAsianBritish,
          detailedEthnicGroupAsian: AsianOrAsianBritish.Bangladeshi,
          doYouSmoke: Smoking.Never,
          lupus: Lupus.No,
          severeMentalIllness: SevereMentalIllness.No,
          antipsychoticMedication: AntipsychoticMedication.No,
          migraines: Migraines.No,
          erectileDysfunction: Impotence.No,
          steroid: SteroidTablets.No,
          rheumatoidArthritis: RheumatoidArthritis.No
        };

      case AboutYouSectionDataType.HIGH_RISK_ASIAN_MALE:
        return {
          townsendPostcode: null,
          familyHeartAttackHistory: ParentSiblingHeartAttack.Yes,
          familyDiabetesHistory: ParentSiblingChildDiabetes.Yes,
          sexAssignedAtBirth: Sex.Male,
          ethnicGroup: EthnicBackground.AsianOrAsianBritish,
          detailedEthnicGroupAsian: AsianOrAsianBritish.Bangladeshi,
          doYouSmoke: Smoking.TwentyOrMorePerDay,
          lupus: Lupus.Yes,
          severeMentalIllness: SevereMentalIllness.Yes,
          antipsychoticMedication: AntipsychoticMedication.Yes,
          migraines: Migraines.Yes,
          erectileDysfunction: Impotence.Yes,
          steroid: SteroidTablets.Yes,
          rheumatoidArthritis: RheumatoidArthritis.Yes
        };

      case AboutYouSectionDataType.MEDIUM_RISK_WHITE_MALE:
        return {
          townsendPostcode: 'E1 8RD',
          familyHeartAttackHistory: ParentSiblingHeartAttack.Yes,
          familyDiabetesHistory: ParentSiblingChildDiabetes.No,
          sexAssignedAtBirth: Sex.Male,
          ethnicGroup: EthnicBackground.White,
          detailedEthnicGroupWhite: WhiteEthnicBackground.GypsyOrIrishTraveller,
          doYouSmoke: Smoking.TenToNineteenPerDay,
          lupus: Lupus.No,
          severeMentalIllness: SevereMentalIllness.No,
          antipsychoticMedication: AntipsychoticMedication.No,
          migraines: Migraines.Yes,
          erectileDysfunction: Impotence.No,
          steroid: SteroidTablets.No,
          rheumatoidArthritis: RheumatoidArthritis.No
        };
      default:
        throw new Error('Unknown strategy type');
    }
  }
}
