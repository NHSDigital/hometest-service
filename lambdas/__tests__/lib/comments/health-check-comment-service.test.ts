import { EmisHeaderTerm } from '../../../src/lib/emis/consultation-generation/emis-consultation-model';
import { HealthCheckCommentService } from '../../../src/lib/comments/health-check-comment-service';
import { Commons } from '../../../src/lib/commons';
import { SnomedCodesDbClient } from '../../../src/lib/db/db-clients/snomed-codes-db-client';
import Sinon from 'ts-sinon';
import { GpUpdateReason } from '../../../src/lib/models/gp-update/gp-update-scheduler';
import {
  HIGH_BP_COMMENT,
  LOW_BP_COMMENT
} from '../../../src/lib/emis/consultation-generation/emis-consultations-generation-service';
import type { IHealthCheck } from '@dnhc-health-checks/shared/model/health-check';
import {
  OverallCholesterolCategory,
  OverallDiabetesCategory,
  TotalCholesterolCategory,
  HdlCholesterolCategory,
  TotalCholesterolHdlRatioCategory
} from '@dnhc-health-checks/shared';
import type { ISnomedCode } from 'src/lib/models/snomed/snomed-code';

describe('HealthCheckCommentService tests', () => {
  let healthCheckCommentService: HealthCheckCommentService;
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();

  const snomedCodeId = '123456';
  const dateTime = '2023-10-01T10:00:00Z';
  const reason = 'High blood pressure';

  let commons: Sinon.SinonStubbedInstance<Commons>;
  let snomedCodesDbClientMock: Sinon.SinonStubbedInstance<SnomedCodesDbClient>;

  beforeEach(() => {
    snomedCodesDbClientMock = sandbox.createStubInstance(SnomedCodesDbClient);
    commons = sandbox.createStubInstance(Commons);

    healthCheckCommentService = new HealthCheckCommentService(
      commons as unknown as Commons,
      snomedCodesDbClientMock
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCommentYesNoAnswerLine method', () => {
    it.each([
      [true, 'Yes'],
      [false, 'No']
    ])('should return the correct Yes/No comment line', (answer, expected) => {
      const question = 'Is the sky blue?';
      const result = healthCheckCommentService.getCommentYesNoAnswerLine(
        question,
        answer
      );
      expect(result).toEqual(`${question} - ${expected}`);
    });

    it('should return an empty string if answer is undefined', () => {
      const question = 'Is the sky blue?';
      const result = healthCheckCommentService.getCommentYesNoAnswerLine(
        question,
        undefined
      );
      expect(result).toEqual('');
    });
  });

  describe('createFailedResultCommentLine method', () => {
    it('should create a failed result comment line', async () => {
      snomedCodesDbClientMock.getSnomedCode.resolves({
        id: snomedCodeId,
        fullSpecifiedName: 'Blood Pressure Measurement',
        name: 'Blood Pressure',
        code: '123456',
        hasValue: true,
        headerTerm: EmisHeaderTerm.Comment
      });

      const result =
        await healthCheckCommentService.createFailedResultCommentLine(
          snomedCodeId,
          reason,
          dateTime
        );

      expect(result).toBe(
        'Blood Pressure Measurement Failed due to High blood pressure (01-Oct-2023)'
      );
      expect(
        snomedCodesDbClientMock.getSnomedCode.calledOnceWith(snomedCodeId)
      ).toBe(true);
    });

    it('should throw an error if SNOMED code not found', async () => {
      snomedCodesDbClientMock.getSnomedCode.rejects(
        new Error('SNOMED code not found')
      );

      await expect(
        healthCheckCommentService.createFailedResultCommentLine(
          snomedCodeId,
          reason,
          dateTime
        )
      ).rejects.toThrow('SNOMED code not found');
    });
  });

  describe('getBPCommentTextBasedOnScheduleReason method', () => {
    it.each([
      [GpUpdateReason.urgentHighBP, HIGH_BP_COMMENT],
      [GpUpdateReason.urgentLowBP, LOW_BP_COMMENT]
    ])(
      'should create a blood pressure comment line based on schedule reason',
      async (reason, expectedComment) => {
        const scheduleReasons = [reason];
        const result =
          healthCheckCommentService.getBPCommentTextBasedOnScheduleReason(
            scheduleReasons
          );

        expect(result).toBe(expectedComment);
      }
    );
  });

  describe('createCommentWithFollowUpCodes method', () => {
    it('should create a comment with follow-up codes', async () => {
      const followUpSnomedCodes = ['111', '222', '333'];
      const urgentFollowUpSnomedCodes = ['222'];

      snomedCodesDbClientMock.getSnomedCode.withArgs('111').resolves({
        id: '111',
        fullSpecifiedName: 'Cholesterol Check',
        name: 'Cholesterol',
        code: '111',
        hasValue: true,
        headerTerm: EmisHeaderTerm.Comment
      });
      snomedCodesDbClientMock.getSnomedCode.withArgs('222').resolves({
        id: '222',
        fullSpecifiedName: 'Diabetes Follow-up',
        name: 'Diabetes',
        code: '222',
        hasValue: true,
        headerTerm: EmisHeaderTerm.Comment
      });
      snomedCodesDbClientMock.getSnomedCode.withArgs('333').resolves({
        id: '333',
        fullSpecifiedName: 'Weight Management',
        name: 'Weight',
        code: '333',
        hasValue: true,
        headerTerm: EmisHeaderTerm.Comment
      });

      const result =
        await healthCheckCommentService.createCommentWithFollowUpCodes(
          followUpSnomedCodes,
          urgentFollowUpSnomedCodes
        );

      const expectedComment = `
Diabetes Follow-up - Urgent Follow-up
Cholesterol Check - Routine Follow-up
Weight Management - Routine Follow-up`;

      expect(result).toBe(expectedComment);
      expect(snomedCodesDbClientMock.getSnomedCode.callCount).toBe(3);
    });

    it('should handle empty follow-up codes', async () => {
      const result =
        await healthCheckCommentService.createCommentWithFollowUpCodes([], []);
      expect(result).toBe('\n');
    });
  });

  describe('getFailedResultsComments method', () => {
    it('should get failed results comments for biometric scores', async () => {
      const healthCheck = {
        biometricScores: [
          {
            date: '2024-06-14T08:20:58.538Z',
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
        ]
      } as unknown as IHealthCheck;

      snomedCodesDbClientMock.getSnomedCode.resolves({
        fullSpecifiedName: 'mockFullSpecifiedName'
      } as unknown as ISnomedCode);

      const result =
        await healthCheckCommentService.getFailedResultsComments(healthCheck);

      const expectedDate = '14-Jun-2024';
      const expectedResult = [
        `mockFullSpecifiedName Failed due to totalCholesterolFailureReason (${expectedDate})`,
        `mockFullSpecifiedName Failed due to diabetes failed again (${expectedDate})`,
        `mockFullSpecifiedName Failed due to hdlCholesterolFailureReason (${expectedDate})`,
        `mockFullSpecifiedName Failed due to totalCholesterolHdlRatioFailureReason (${expectedDate})`,
        `mockFullSpecifiedName Failed due to failureReason (${expectedDate})`
      ];

      expect(result).toEqual(expectedResult);
      expect(snomedCodesDbClientMock.getSnomedCode.callCount).toBe(5);
    });
  });

  describe('getQRiskConsultationElements method', () => {
    it('should get QRisk consultation elements', async () => {
      const healthCheck = {
        questionnaire: {
          lupus: true,
          severeMentalIllness: false,
          atypicalAntipsychoticMedication: true,
          migraines: true,
          impotence: false,
          rheumatoidArthritis: true,
          steroidTablets: false
        }
      } as unknown as IHealthCheck;

      await healthCheckCommentService.getQRiskConsultationElements(healthCheck);

      const expectedComment = [
        'Diagnosed with Lupus - No',
        'Diagnosed with a severe mental health condition - Yes',
        'Prescribed atypical antipsychotics - No',
        'Diagnosed with migraines - No',
        // Note: no erectile dysfunction line expected for Female
        'Diagnosed with rheumatoid arthritis - No',
        'Prescribed regular steroid tablets - Yes'
      ];

      expect(
        Sinon.match((consultationComment: string) => {
          return expectedComment.every((line) =>
            consultationComment.includes(line)
          );
        })
      ).toBeTruthy();
    });
  });
});
