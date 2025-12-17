import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import {
  ActivityCategory,
  BloodTestExpiryWritebackStatus,
  HealthCheckSteps,
  type IHealthCheck,
  LeicesterRiskCategory,
  BloodPressureLocation,
  DoYouDrinkAlcohol,
  EthnicBackground,
  HeightDisplayPreference,
  ParentSiblingChildDiabetes,
  ParentSiblingHeartAttack,
  Sex,
  Smoking,
  WaistMeasurementDisplayPreference,
  WeightDisplayPreference,
  QRiskCategory,
  DiabetesCategory,
  HdlCholesterolCategory,
  OverallCholesterolCategory,
  OverallDiabetesCategory,
  TotalCholesterolCategory,
  TotalCholesterolHdlRatioCategory
} from '@dnhc-health-checks/shared';
import { EmisGenericMapperService } from '../../../src/lib/emis/consultation-generation/mapper/emis-generic-mapper';
import {
  EmisConsultationsGenerationService,
  FollowUpConsultationRequired,
  HIGH_BP_COMMENT,
  LOW_BP_COMMENT
} from '../../../src/lib/emis/consultation-generation/emis-consultations-generation-service';
import { GpUpdateReason } from '../../../src/lib/models/gp-update/gp-update-scheduler';
import {
  FollowUpType,
  HealthCheckFollowUpService
} from '../../../src/lib/follow-ups/health-check-follow-up-service';
import * as followUpUtils from '../../../src/lib/follow-ups/follow-up-utils';
import { HealthCheckCommentService } from '../../../src/lib/comments/health-check-comment-service';

describe('EmisConsultationsGenerationService', () => {
  let healthCheck = createHealthCheck();
  const authorUserId = '1234';
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();

  let emisService: EmisConsultationsGenerationService;
  let commons: Sinon.SinonStubbedInstance<Commons>;
  let mapperService: Sinon.SinonStubbedInstance<EmisGenericMapperService>;
  let healthCheckFollowUpServiceMock: Sinon.SinonStubbedInstance<HealthCheckFollowUpService>;
  let healthCheckCommentServiceMock: Sinon.SinonStubbedInstance<HealthCheckCommentService>;
  let getFollowUpCodesForEmisStub: Sinon.SinonStub;

  beforeEach(() => {
    healthCheck = createHealthCheck();
    commons = sandbox.createStubInstance(Commons);
    mapperService = sandbox.createStubInstance(EmisGenericMapperService);
    healthCheckFollowUpServiceMock = sandbox.createStubInstance(
      HealthCheckFollowUpService
    );
    healthCheckCommentServiceMock = sandbox.createStubInstance(
      HealthCheckCommentService
    );

    emisService = new EmisConsultationsGenerationService(
      commons as unknown as Commons,
      mapperService as unknown as EmisGenericMapperService,
      healthCheckFollowUpServiceMock,
      healthCheckCommentServiceMock as unknown as HealthCheckCommentService
    );

    mapperService.mapConsultationElement.resolves({ ProblemSection: 1 });
    healthCheckFollowUpServiceMock.getHealthCheckFollowUpDetails.returns([]);
    healthCheckCommentServiceMock.getFailedResultsComments.resolves([]);
    getFollowUpCodesForEmisStub = sandbox.stub(
      followUpUtils,
      'getFollowUpCodesForEmis'
    );
    getFollowUpCodesForEmisStub.returns([]);
  });

  afterEach(() => {
    sandbox.restore();
    getFollowUpCodesForEmisStub.restore();
  });

  describe('generateConsultations method', () => {
    it.each([true, false, undefined])(
      'Signs XML, isPartial = %s',
      async (isPartial) => {
        const consultationsResult = await emisService.generateConsultations(
          healthCheck,
          authorUserId,
          isPartial
        );

        assertMapperServiceCalledForEachArgument(
          [
            'height',
            'weight',
            'waist',
            'heartAge',
            'qRiskScore',
            'bmi',
            'systolicBP1',
            'diastolicBP1',
            'alcoholAudit',
            isPartial !== undefined && isPartial
              ? 'incompleteHealthCheck'
              : 'completedHealthCheck',
            'smokingStatusNonSmoker',
            'gppaqScoreActive',
            'diabetesRiskScore'
          ],
          isPartial
        );

        Sinon.assert.calledWith(
          mapperService.mapConsultationElement,
          healthCheck,
          'cholesterol',
          authorUserId,
          isPartial === true,
          undefined,
          healthCheck.biometricScores?.[0].scores.cholesterol?.totalCholesterol
        );

        Sinon.assert.calledWith(
          mapperService.mapConsultationElement,
          healthCheck,
          'hdlCholesterol',
          authorUserId,
          isPartial === true,
          undefined,
          healthCheck.biometricScores?.[0].scores.cholesterol?.hdlCholesterol
        );

        Sinon.assert.calledWith(
          mapperService.mapConsultationElement,
          healthCheck,
          'totalCholesterolRatio',
          authorUserId,
          isPartial === true,
          undefined,
          healthCheck.biometricScores?.[0].scores.cholesterol
            ?.totalCholesterolHdlRatio
        );

        Sinon.assert.calledWith(
          mapperService.mapConsultationElement,
          healthCheck,
          'hba1cDiabetes',
          authorUserId,
          isPartial === true,
          undefined,
          healthCheck.biometricScores?.[0].scores.diabetes?.hba1c
        );

        Sinon.assert.neverCalledWith(
          mapperService.mapConsultationElement,
          Sinon.match.any,
          'familyHistory',
          Sinon.match.any,
          Sinon.match.any
        );

        Sinon.assert.neverCalledWith(
          mapperService.mapConsultationElement,
          Sinon.match.any,
          'familyHistoryOfDiabetes',
          Sinon.match.any,
          Sinon.match.any
        );

        expect(consultationsResult.consultations.length).toEqual(17);
      }
    );

    it.each([true, false, undefined])(
      'Should include familyHistory consultation if hasFamilyHeartAttackHistory is true, isPartial = %s',
      async (isPartial) => {
        healthCheck.questionnaire.hasFamilyHeartAttackHistory =
          ParentSiblingHeartAttack.Yes;

        const consultationsResult = await emisService.generateConsultations(
          healthCheck,
          authorUserId,
          isPartial
        );

        assertMapperServiceCalledForEachArgument(
          [
            'height',
            'weight',
            'waist',
            'heartAge',
            'qRiskScore',
            'bmi',
            'systolicBP1',
            'diastolicBP1',
            'alcoholAudit',
            isPartial !== undefined && isPartial
              ? 'incompleteHealthCheck'
              : 'completedHealthCheck',
            'smokingStatusNonSmoker',
            'gppaqScoreActive',
            'familyHistory',
            'diabetesRiskScore'
          ],
          isPartial
        );

        expect(consultationsResult.consultations.length).toEqual(18);
      }
    );

    it.each([
      [
        Sex.Male,
        {
          lupus: true,
          severeMentalIllness: false,
          atypicalAntipsychoticMedication: true,
          migraines: true,
          impotence: false,
          rheumatoidArthritis: true,
          steroidTablets: false
        },
        [
          'Diagnosed with Lupus - Yes',
          'Diagnosed with a severe mental health condition - No',
          'Prescribed atypical antipsychotics - Yes',
          'Diagnosed with migraines - Yes',
          'Diagnosed with erectile dysfunction - No',
          'Diagnosed with rheumatoid arthritis - Yes',
          'Prescribed regular steroid tablets - No'
        ]
      ],
      [
        Sex.Female,
        {
          lupus: false,
          severeMentalIllness: true,
          atypicalAntipsychoticMedication: false,
          migraines: false,
          impotence: true, // will be ignored for female
          rheumatoidArthritis: false,
          steroidTablets: true
        },
        [
          'Diagnosed with Lupus - No',
          'Diagnosed with a severe mental health condition - Yes',
          'Prescribed atypical antipsychotics - No',
          'Diagnosed with migraines - No',
          // Note: no erectile dysfunction line expected for Female
          'Diagnosed with rheumatoid arthritis - No',
          'Prescribed regular steroid tablets - Yes'
        ]
      ]
    ])(
      'should generate proper qRisk consultation comment for %s questionnaire',
      async (gender, questionnaireValues, dataReceivedFromCommentService) => {
        healthCheckCommentServiceMock.getQRiskConsultationElements.returns(
          dataReceivedFromCommentService.toString()
        );
        // Set the questionnaire values from the test case
        healthCheck.questionnaire.lupus = questionnaireValues.lupus;
        healthCheck.questionnaire.severeMentalIllness =
          questionnaireValues.severeMentalIllness;
        healthCheck.questionnaire.atypicalAntipsychoticMedication =
          questionnaireValues.atypicalAntipsychoticMedication;
        healthCheck.questionnaire.migraines = questionnaireValues.migraines;
        healthCheck.questionnaire.impotence = questionnaireValues.impotence;
        healthCheck.questionnaire.rheumatoidArthritis =
          questionnaireValues.rheumatoidArthritis;
        healthCheck.questionnaire.steroidTablets =
          questionnaireValues.steroidTablets;

        healthCheck.questionnaire.sex = gender;

        await emisService.generateConsultations(
          healthCheck,
          authorUserId,
          false
        );

        Sinon.assert.calledOnce(
          healthCheckCommentServiceMock.getQRiskConsultationElements
        );

        Sinon.assert.calledWith(
          mapperService.mapConsultationElement,
          healthCheck,
          'qRiskScore',
          authorUserId,
          false,
          Sinon.match((consultationComment: string) =>
            dataReceivedFromCommentService.every((line) =>
              consultationComment.includes(line)
            )
          )
        );
      }
    );

    it.each([
      [Smoking.Quitted, 'smokingStatusExSmoker', true],
      [Smoking.Quitted, 'smokingStatusExSmoker', false],
      [Smoking.TwentyOrMorePerDay, 'smokingStatusHeavySmoker', true],
      [Smoking.TwentyOrMorePerDay, 'smokingStatusHeavySmoker', false],
      [Smoking.UpToNinePerDay, 'smokingStatusLightSmoker', true],
      [Smoking.UpToNinePerDay, 'smokingStatusLightSmoker', false],
      [Smoking.TenToNineteenPerDay, 'smokingStatusModerateSmoker', true],
      [Smoking.TenToNineteenPerDay, 'smokingStatusModerateSmoker', false],
      [Smoking.Never, 'smokingStatusNonSmoker', true],
      [Smoking.Never, 'smokingStatusNonSmoker', false]
    ])(
      'Should include properly mapped smoking consultation based on smoking answers, %s',
      async (smokingAnswer, expectedSnomedId, isPartial) => {
        healthCheck.questionnaire.smoking = smokingAnswer;

        await emisService.generateConsultations(
          healthCheck,
          authorUserId,
          isPartial
        );

        assertMapperServiceCalledForEachArgument(
          [
            isPartial ? 'incompleteHealthCheck' : 'completedHealthCheck',
            expectedSnomedId
          ],
          isPartial
        );
      }
    );

    it.each([true, false])(
      'Should not include smoking consultation if no smoking answers, %s',
      async (isPartial) => {
        healthCheck.questionnaire.smoking = undefined;

        await emisService.generateConsultations(
          healthCheck,
          authorUserId,
          isPartial
        );

        Sinon.assert.notCalled(
          mapperService.mapConsultationElement.withArgs(
            Sinon.match.any,
            Sinon.match('smoking'),
            Sinon.match.any,
            Sinon.match.any
          )
        );
      }
    );

    it.each([
      [ActivityCategory.Active, 'gppaqScoreActive', true],
      [ActivityCategory.Active, 'gppaqScoreActive', false],
      [ActivityCategory.Inactive, 'gppaqScoreInactive', true],
      [ActivityCategory.Inactive, 'gppaqScoreInactive', false],
      [ActivityCategory.ModeratelyActive, 'gppaqScoreModeratelyActive', true],
      [ActivityCategory.ModeratelyActive, 'gppaqScoreModeratelyActive', false],
      [
        ActivityCategory.ModeratelyInactive,
        'gppaqScoreModeratelyInactive',
        true
      ],
      [
        ActivityCategory.ModeratelyInactive,
        'gppaqScoreModeratelyInactive',
        false
      ]
    ])(
      'Should include properly mapped GPPAQ consultation based on activity answers, %s',
      async (activityCategory, expectedSnomedId, isPartial) => {
        if (healthCheck.questionnaireScores) {
          healthCheck.questionnaireScores.activityCategory = activityCategory;
        }

        await emisService.generateConsultations(
          healthCheck,
          authorUserId,
          isPartial
        );

        assertMapperServiceCalledForEachArgument(
          [
            isPartial ? 'incompleteHealthCheck' : 'completedHealthCheck',
            expectedSnomedId
          ],
          isPartial
        );
      }
    );

    it.each([true, false])(
      'Should not include activity consultation if no activity category, %s',
      async (isPartial) => {
        if (healthCheck.questionnaireScores) {
          healthCheck.questionnaireScores.activityCategory = undefined;
        }

        await emisService.generateConsultations(
          healthCheck,
          authorUserId,
          isPartial
        );

        Sinon.assert.notCalled(
          mapperService.mapConsultationElement.withArgs(
            Sinon.match.any,
            Sinon.match('gppaq'),
            Sinon.match.any,
            Sinon.match.any
          )
        );
      }
    );

    it.each([true, false])(
      'Should include familyHistoryOfDiabetes consultation if hasFamilyDiabetesHistory is Yes, isPartial = %s',
      async (isPartial) => {
        healthCheck.questionnaire.hasFamilyDiabetesHistory =
          ParentSiblingChildDiabetes.Yes;

        const consultationsResult = await emisService.generateConsultations(
          healthCheck,
          authorUserId,
          isPartial
        );

        assertMapperServiceCalledForEachArgument(
          [
            'height',
            'weight',
            'waist',
            'heartAge',
            'qRiskScore',
            'bmi',
            'systolicBP1',
            'diastolicBP1',
            'alcoholAudit',
            isPartial ? 'incompleteHealthCheck' : 'completedHealthCheck',
            'smokingStatusNonSmoker',
            'gppaqScoreActive',
            'familyHistoryOfDiabetes',
            'diabetesRiskScore'
          ],
          isPartial
        );

        expect(consultationsResult.consultations.length).toEqual(18);
      }
    );
  });

  it.each([true, false])(
    'Should include self reported blood pressure consultations if bloodPressureLocation is set to Monitor, isPartial = %s',
    async (isPartial) => {
      healthCheck.questionnaire.bloodPressureLocation =
        BloodPressureLocation.Monitor;

      const consultationsResult = await emisService.generateConsultations(
        healthCheck,
        authorUserId,
        isPartial
      );

      assertMapperServiceCalledForEachArgument(
        [
          'height',
          'weight',
          'waist',
          'heartAge',
          'qRiskScore',
          'bmi',
          'systolicBP1Home',
          'diastolicBP1Home',
          'alcoholAudit',
          isPartial ? 'incompleteHealthCheck' : 'completedHealthCheck',
          'smokingStatusNonSmoker',
          'gppaqScoreActive',
          'diabetesRiskScore'
        ],
        isPartial
      );

      expect(consultationsResult.consultations.length).toEqual(17);
    }
  );

  it.each([
    [[], [], undefined, FollowUpConsultationRequired.No, true, undefined],
    [
      ['qRiskScore'],
      [],
      'followUpRequired',
      FollowUpConsultationRequired.Yes,
      true,
      '\nmockFullSpecifiedName - Routine Follow-up'
    ],
    [
      [],
      ['diabetesUrgent'],
      'urgentFollowUpRequired',
      FollowUpConsultationRequired.Urgent,
      true,
      '\nmockFullSpecifiedName - Urgent Follow-up'
    ],
    [
      ['bmiObese', 'smokingStatusHeavySmoker'],
      ['cholesterol', 'diabetesRiskScore'],
      'urgentFollowUpRequired',
      FollowUpConsultationRequired.Urgent,
      true,
      '\nmockFullSpecifiedName - Urgent Follow-up\nmockFullSpecifiedName - Urgent Follow-up\nmockFullSpecifiedName - Routine Follow-up\nmockFullSpecifiedName - Routine Follow-up'
    ],
    [[], [], undefined, FollowUpConsultationRequired.No, false, undefined],
    [
      ['gppaqScoreInactive'],
      [],
      'followUpRequired',
      FollowUpConsultationRequired.Yes,
      false,
      '\nmockFullSpecifiedName - Routine Follow-up'
    ],
    [
      [],
      ['hba1cDiabetes'],
      'urgentFollowUpRequired',
      FollowUpConsultationRequired.Urgent,
      false,
      '\nmockFullSpecifiedName - Urgent Follow-up'
    ],
    [
      ['hdlCholesterol', 'alcoholAudit'],
      ['alcoholAudit'], // the same urgent follow up code as non-urgent
      'urgentFollowUpRequired',
      FollowUpConsultationRequired.Urgent,
      false,
      '\nmockFullSpecifiedName - Urgent Follow-up\nmockFullSpecifiedName - Routine Follow-up'
    ]
  ])(
    'Should or should not include proper followup tags based on follow up assessment',
    async (
      followUpCodes: string[],
      urgentFollowUpCodes: string[],
      additionalFollowUpConsultationExpected: string | undefined,
      followUpInResultExpected: FollowUpConsultationRequired,
      isPartial: boolean,
      expectedComment: string | undefined
      // eslint-disable-next-line max-params
    ) => {
      getFollowUpCodesForEmisStub
        .withArgs(Sinon.match.any, FollowUpType.Routine)
        .returns(followUpCodes);
      getFollowUpCodesForEmisStub
        .withArgs(Sinon.match.any, FollowUpType.Urgent)
        .returns(urgentFollowUpCodes);

      healthCheckCommentServiceMock.createCommentWithFollowUpCodes.resolves(
        expectedComment
      );

      const consultationsResult = await emisService.generateConsultations(
        healthCheck,
        authorUserId,
        isPartial
      );

      assertMapperServiceCalledForEachArgument(
        [
          'height',
          'weight',
          'waist',
          'heartAge',
          'qRiskScore',
          'bmi',
          'systolicBP1',
          'diastolicBP1',
          'alcoholAudit',
          isPartial ? 'incompleteHealthCheck' : 'completedHealthCheck',
          'smokingStatusNonSmoker',
          'gppaqScoreActive',
          'diabetesRiskScore'
        ],
        isPartial
      );
      if (additionalFollowUpConsultationExpected) {
        expect(mapperService.mapConsultationElement.lastCall.args[0]).toEqual(
          healthCheck
        );
        expect(mapperService.mapConsultationElement.lastCall.args[1]).toEqual(
          additionalFollowUpConsultationExpected
        );
        expect(mapperService.mapConsultationElement.lastCall.args[2]).toEqual(
          authorUserId
        );
        expect(mapperService.mapConsultationElement.lastCall.args[3]).toEqual(
          isPartial
        );
        expect(mapperService.mapConsultationElement.lastCall.args[4]).toEqual(
          expectedComment
        );
      }

      expect(consultationsResult.consultations.length).toEqual(
        17 + (additionalFollowUpConsultationExpected ? 1 : 0)
      );
      expect(consultationsResult.followUpRequired).toEqual(
        followUpInResultExpected
      );
    }
  );

  it.each([true, false])(
    'Should set health check status to incomplete if there are failed biometric scores, isPartial = %s',
    async (isPartial) => {
      healthCheck.biometricScores = [
        {
          date: '2024-06-12T08:20:58.538Z',
          scores: {
            cholesterol: {
              overallCategory: OverallCholesterolCategory.CompleteFailure,
              totalCholesterolFailureReason: 'totalCholesterolFailureReason',
              hdlCholesterolFailureReason: 'hdlCholesterolFailureReason',
              totalCholesterolHdlRatioFailureReason:
                'totalCholesterolHdlRatioFailureReason'
            },
            diabetes: {
              overallCategory: OverallDiabetesCategory.CompleteFailure,
              failureReason: 'failureReason'
            }
          }
        }
      ];

      await emisService.generateConsultations(
        healthCheck,
        authorUserId,
        isPartial
      );

      assertMapperServiceCalledForEachArgument(
        ['incompleteHealthCheck'],
        isPartial
      );
    }
  );

  it.each([true, false])(
    'Should include comment consultation with failed biometric scores, isPartial = %s',
    async (isPartial) => {
      healthCheck.biometricScores = [
        {
          date: '2024-06-12T08:20:58.538Z',
          scores: {
            cholesterol: {
              overallCategory: OverallCholesterolCategory.CompleteFailure,
              totalCholesterolFailureReason: 'totalCholesterolFailureReason',
              hdlCholesterolFailureReason: 'hdlCholesterolFailureReason',
              totalCholesterolHdlRatioFailureReason:
                'totalCholesterolHdlRatioFailureReason'
            },
            diabetes: {
              overallCategory: OverallDiabetesCategory.CompleteFailure,
              failureReason: 'failureReason'
            }
          }
        },
        {
          date: '2024-06-14T08:20:58.538Z',
          scores: {
            cholesterol: {
              overallCategory: OverallCholesterolCategory.Normal,
              totalCholesterol: 4,
              totalCholesterolCategory: TotalCholesterolCategory.Normal,
              hdlCholesterol: 1,
              hdlCholesterolCategory: HdlCholesterolCategory.Normal,
              totalCholesterolHdlRatio: 5,
              totalCholesterolHdlRatioCategory:
                TotalCholesterolHdlRatioCategory.Normal
            },
            diabetes: {
              overallCategory: OverallDiabetesCategory.CompleteFailure,
              failureReason: 'diabetes failed again'
            }
          }
        }
      ];

      const expectedDate = '12-Jun-2024';
      const expectedCommentLines = [
        `mockFullSpecifiedName Failed due to totalCholesterolFailureReason (${expectedDate})`,
        `mockFullSpecifiedName Failed due to hdlCholesterolFailureReason (${expectedDate})`,
        `mockFullSpecifiedName Failed due to totalCholesterolHdlRatioFailureReason (${expectedDate})`,
        `mockFullSpecifiedName Failed due to failureReason (${expectedDate})`,
        `mockFullSpecifiedName Failed due to diabetes failed again (${expectedDate})`
      ];

      healthCheckCommentServiceMock.getFailedResultsComments.resolves(
        expectedCommentLines
      );

      await emisService.generateConsultations(
        healthCheck,
        authorUserId,
        isPartial
      );

      Sinon.assert.calledWith(
        mapperService.mapConsultationComment,
        authorUserId,
        Sinon.match((comment: string) =>
          expectedCommentLines.every((line) => comment.includes(line))
        )
      );
    }
  );

  it.each([
    [[GpUpdateReason.urgentHighBP], HIGH_BP_COMMENT],
    [[GpUpdateReason.urgentHighBP, GpUpdateReason.auditScore], HIGH_BP_COMMENT],
    [[GpUpdateReason.urgentLowBP], LOW_BP_COMMENT],
    [[GpUpdateReason.urgentLowBP, GpUpdateReason.auditScore], LOW_BP_COMMENT],
    [[GpUpdateReason.expiryQuestionnaire], undefined]
  ])(
    'should include advice in the comment for urgent bp schedule reason',
    async (
      scheduleReasons: GpUpdateReason[],
      expectedComment: string | undefined
    ) => {
      healthCheckCommentServiceMock.getBPCommentTextBasedOnScheduleReason.returns(
        expectedComment
      );

      await emisService.generateConsultations(
        healthCheck,
        authorUserId,
        true,
        scheduleReasons
      );

      Sinon.assert.calledOnce(
        healthCheckCommentServiceMock.getBPCommentTextBasedOnScheduleReason
      );

      Sinon.assert.calledWith(
        mapperService.mapConsultationElement,
        healthCheck,
        'systolicBP1',
        authorUserId,
        true
      );
      Sinon.assert.calledWith(
        mapperService.mapConsultationElement,
        healthCheck,
        'diastolicBP1',
        authorUserId,
        true,
        expectedComment
      );
    }
  );

  function assertMapperServiceCalledForEachArgument(
    argList: string[],
    isPartial = false
  ): void {
    argList.forEach((arg: string) => {
      Sinon.assert.calledWith(
        mapperService.mapConsultationElement,
        healthCheck,
        arg,
        authorUserId,
        isPartial
      );
    });
  }

  function createHealthCheck(): IHealthCheck {
    return {
      dataModelVersion: '1.0.0',
      nhsNumber: '9285931021',
      patientId: '11223344',
      ageAtCompletion: 60,
      questionnaireScores: {
        activityCategory: ActivityCategory.Active,
        leicesterRiskScore: 1,
        leicesterRiskCategory: LeicesterRiskCategory.Low
      },
      questionnaireCompletionDate: '2024-06-12T08:20:58.538Z',
      riskScores: {
        heartAge: 84,
        scoreCalculationDate: '2024-06-12T08:20:58.538Z',
        qRiskScore: 38.961766,
        qRiskScoreCategory: QRiskCategory.High
      },
      createdAt: '2024-06-11T07:15:36.507Z',
      step: HealthCheckSteps.LAB_RESULTS_RECEIVED,
      questionnaire: {
        bloodPressureDiastolic: 137,
        alcoholGuilt: null,
        alcoholMultipleDrinksOneOccasion: null,
        heightDisplayPreference: HeightDisplayPreference.Centimetres,
        ethnicBackground: EthnicBackground.White,
        detailedEthnicGroup: null,
        smoking: Smoking.Never,
        bloodPressureSystolic: 190,
        bloodPressureLocation: BloodPressureLocation.Pharmacy,
        hasPreExistingCondition: false,
        drinkAlcohol: DoYouDrinkAlcohol.Never,
        height: 170,
        alcoholCannotStop: null,
        weightDisplayPreference: WeightDisplayPreference.Kilograms,
        sex: Sex.Male,
        weight: 90,
        alcoholHowOften: null,
        hasCompletedHealthCheckInLast5Years: false,
        alcoholMorningDrink: null,
        alcoholPersonInjured: null,
        alcoholConcernedRelative: null,
        alcoholDailyUnits: null,
        alcoholFailedObligations: null,
        alcoholMemoryLoss: null,
        hasFamilyHeartAttackHistory: ParentSiblingHeartAttack.No,
        hasFamilyDiabetesHistory: ParentSiblingChildDiabetes.No,
        waistMeasurement: 76.2,
        waistMeasurementDisplayPreference:
          WaistMeasurementDisplayPreference.Centimetres
      },
      id: 'a6566c1a-a1fd-4605-a519-e597e23f36ed',
      ageAtStart: 44,
      bloodTestOrder: undefined,
      bloodTestExpiryWritebackStatus: BloodTestExpiryWritebackStatus.NA,
      biometricScores: [
        {
          date: '2024-06-12T08:20:58.538Z',
          scores: {
            cholesterol: {
              overallCategory: OverallCholesterolCategory.Normal,
              totalCholesterol: 4,
              totalCholesterolCategory: TotalCholesterolCategory.Normal,
              hdlCholesterol: 1,
              hdlCholesterolCategory: HdlCholesterolCategory.Normal,
              totalCholesterolHdlRatio: 5,
              totalCholesterolHdlRatioCategory:
                TotalCholesterolHdlRatioCategory.Normal
            },
            diabetes: {
              hba1c: 40,
              category: DiabetesCategory.Low,
              overallCategory: OverallDiabetesCategory.Low
            }
          }
        }
      ],
      wasInvited: false
    };
  }
});
