import Sinon from 'ts-sinon';
import { Commons } from '../../../../../src/lib/commons';
import { type IHealthCheck } from '@dnhc-health-checks/shared';
import {
  type ConsultationElementData,
  EmisConsultationElementGenerationService
} from '../../../../../src/lib/emis/consultation-generation/emis-consultation-element-generation-service';
import {
  EmisEventType,
  EmisHeaderTerm
} from '../../../../../src/lib/emis/consultation-generation/emis-consultation-model';
import { SnomedCodesDbClient } from '../../../../../src/lib/db/db-clients/snomed-codes-db-client';
import { EmisGenericMapperService } from '../../../../../src/lib/emis/consultation-generation/mapper/emis-generic-mapper';
import { type FileRecordPayloadConfig } from '../../../../../src/lib/emis/emis-transaction-service';
import { ResultDateSource } from '../../../../../src/lib/models/snomed/snomed-code';

const mockDate = '2024-04-23T11:23:12.123Z';
jest.useFakeTimers().setSystemTime(Date.parse(mockDate));

describe('EmisGenericMapperService', () => {
  const sandbox = Sinon.createSandbox();
  const nhcVersion = 'nhcVersion';
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let snomedDbClientStub: Sinon.SinonStubbedInstance<SnomedCodesDbClient>;
  let emisConsultationElementGenerationServiceStub: Sinon.SinonStubbedInstance<EmisConsultationElementGenerationService>;
  const userId = '1234';
  const heightSnomedCode = {
    id: 'height',
    name: 'height',
    code: '1153637007',
    headerTerm: EmisHeaderTerm.Examination,
    fullSpecifiedName: 'Body height (observable entity)',
    units: 'cm',
    variableName: 'questionnaire.height',
    hasValue: true
  };
  const noValueSnomedCode = {
    id: 'novalue',
    name: 'novalue',
    code: '27113001',
    headerTerm: EmisHeaderTerm.Examination,
    fullSpecifiedName: 'Some name',
    units: 'kg',
    variableName: 'questionnaire.height',
    hasValue: false
  };
  const missingValueSnomedCode = {
    id: 'bmi',
    name: 'bmi',
    code: '123123123',
    headerTerm: EmisHeaderTerm.Examination,
    fullSpecifiedName: 'BMI (observable entity)',
    variableName: 'questionnaireScores.bmi',
    hasValue: true
  };
  const noUnitsSnomedCode = {
    id: 'nounits',
    name: 'nounits',
    code: '27113001',
    headerTerm: EmisHeaderTerm.Examination,
    fullSpecifiedName: 'Some name',
    variableName: 'questionnaire.height',
    hasValue: true
  };
  const noValueAndUnitsSnomedCode = {
    id: 'novalueunits',
    name: 'novalueunits',
    code: '27113001',
    headerTerm: EmisHeaderTerm.Examination,
    fullSpecifiedName: 'Some name',
    variableName: 'questionnaire.height',
    hasValue: false
  };
  const biometricSnomedCode = {
    ...heightSnomedCode,
    id: 'biometric',
    resultDateSource: ResultDateSource.BIOMETRIC_TEST_DATE
  };
  const riskSnomedCode = {
    ...heightSnomedCode,
    id: 'risk',
    resultDateSource: ResultDateSource.RISC_SCORE_CALCULATION_DATE
  };
  const invalidSnomedCode = {
    ...heightSnomedCode,
    id: 'invalid',
    resultDateSource: 'UNSUPPORTED_SOURCE' as unknown as ResultDateSource
  };

  let genericMapper: EmisGenericMapperService;

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    snomedDbClientStub = sandbox.createStubInstance(SnomedCodesDbClient);
    snomedDbClientStub.getSnomedCode
      .withArgs(heightSnomedCode.id)
      .resolves(heightSnomedCode);
    snomedDbClientStub.getSnomedCode
      .withArgs(noValueSnomedCode.id)
      .resolves(noValueSnomedCode);
    snomedDbClientStub.getSnomedCode
      .withArgs(noUnitsSnomedCode.id)
      .resolves(noUnitsSnomedCode);
    snomedDbClientStub.getSnomedCode
      .withArgs(noValueAndUnitsSnomedCode.id)
      .resolves(noValueAndUnitsSnomedCode);
    snomedDbClientStub.getSnomedCode
      .withArgs(missingValueSnomedCode.id)
      .resolves(missingValueSnomedCode);
    snomedDbClientStub.getSnomedCode
      .withArgs(biometricSnomedCode.id)
      .resolves(biometricSnomedCode);
    snomedDbClientStub.getSnomedCode
      .withArgs(riskSnomedCode.id)
      .resolves(riskSnomedCode);
    snomedDbClientStub.getSnomedCode
      .withArgs(invalidSnomedCode.id)
      .resolves(invalidSnomedCode);
    commonsStub.nhcVersion = nhcVersion;
    emisConsultationElementGenerationServiceStub = sandbox.createStubInstance(
      EmisConsultationElementGenerationService
    );

    genericMapper = new EmisGenericMapperService(
      commonsStub as unknown as Commons,
      emisConsultationElementGenerationServiceStub,
      snomedDbClientStub,
      { isAbnormal: false, eventType: 5 } as unknown as FileRecordPayloadConfig
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('mapConsultationElement', () => {
    it('maps a basic height segment to expected structure', async () => {
      const healthCheck = getMockHealthCheck();
      await genericMapper.mapConsultationElement(
        healthCheck,
        heightSnomedCode.id,
        userId,
        false
      );

      sandbox.assert.calledWith(
        snomedDbClientStub.getSnomedCode,
        heightSnomedCode.id
      );
      sandbox.assert.calledWith(
        emisConsultationElementGenerationServiceStub.generateConsultationElement,
        {
          authorUserId: userId,
          header: heightSnomedCode.headerTerm,
          term: heightSnomedCode.fullSpecifiedName,
          displayTerm: `${heightSnomedCode.fullSpecifiedName} ${healthCheck.questionnaire.height} ${heightSnomedCode.units}`,
          date: '19/01/2024',
          time: '08:55:11',
          snomedCode: heightSnomedCode.code,
          valueNumeric: healthCheck.questionnaire.height!,
          units: heightSnomedCode.units,
          isAbnormal: false,
          descriptiveText: undefined,
          eventType: EmisEventType.Values
        }
      );
    });

    it('maps display term correctly when value is empty', async () => {
      const healthCheck = getMockHealthCheck();
      await genericMapper.mapConsultationElement(
        healthCheck,
        noValueSnomedCode.id,
        userId,
        false
      );

      sandbox.assert.calledWith(
        emisConsultationElementGenerationServiceStub.generateConsultationElement,
        {
          authorUserId: userId,
          header: noValueSnomedCode.headerTerm,
          term: noValueSnomedCode.fullSpecifiedName,
          displayTerm: `${noValueSnomedCode.fullSpecifiedName}`,
          date: '19/01/2024',
          time: '08:55:11',
          snomedCode: noValueSnomedCode.code,
          valueNumeric: undefined,
          units: noValueSnomedCode.units,
          isAbnormal: false,
          descriptiveText: undefined,
          eventType: EmisEventType.Values
        }
      );
    });

    it('maps value with displayTerm correctly when value is passed to method', async () => {
      const healthCheck = getMockHealthCheck();
      const value = 20;
      await genericMapper.mapConsultationElement(
        healthCheck,
        heightSnomedCode.id,
        userId,
        false,
        undefined,
        value
      );

      sandbox.assert.calledWith(
        snomedDbClientStub.getSnomedCode,
        heightSnomedCode.id
      );
      sandbox.assert.calledWith(
        emisConsultationElementGenerationServiceStub.generateConsultationElement,
        {
          authorUserId: userId,
          header: heightSnomedCode.headerTerm,
          term: heightSnomedCode.fullSpecifiedName,
          displayTerm: `${heightSnomedCode.fullSpecifiedName} ${value} ${heightSnomedCode.units}`,
          date: '19/01/2024',
          time: '08:55:11',
          snomedCode: heightSnomedCode.code,
          valueNumeric: value,
          units: heightSnomedCode.units,
          isAbnormal: false,
          descriptiveText: undefined,
          eventType: EmisEventType.Values
        }
      );
    });

    it('Does not map elements with value when value is empty and isPartial flag is true', async () => {
      const healthCheck = getMockHealthCheck();
      const consultation = await genericMapper.mapConsultationElement(
        healthCheck,
        missingValueSnomedCode.id,
        userId,
        true
      );

      expect(consultation).toBeNull();

      sandbox.assert.notCalled(
        emisConsultationElementGenerationServiceStub.generateConsultationElement
      );
    });

    it('Throws error when value is empty and isPartial flag is false', async () => {
      const healthCheck = getMockHealthCheck();
      await expect(
        genericMapper.mapConsultationElement(
          healthCheck,
          missingValueSnomedCode.id,
          userId,
          false
        )
      ).rejects.toThrow('Snomed value not found in given health check');
      sandbox.assert.notCalled(
        emisConsultationElementGenerationServiceStub.generateConsultationElement
      );
    });

    it('maps display term correctly when unit is empty', async () => {
      const healthCheck = getMockHealthCheck();
      await genericMapper.mapConsultationElement(
        healthCheck,
        noUnitsSnomedCode.id,
        userId,
        false,
        'someDescriptiveText'
      );

      sandbox.assert.calledWith(
        emisConsultationElementGenerationServiceStub.generateConsultationElement,
        {
          authorUserId: userId,
          header: noUnitsSnomedCode.headerTerm,
          term: noUnitsSnomedCode.fullSpecifiedName,
          displayTerm: `${noUnitsSnomedCode.fullSpecifiedName} ${healthCheck.questionnaire.height}`,
          date: '19/01/2024',
          time: '08:55:11',
          snomedCode: noUnitsSnomedCode.code,
          valueNumeric: healthCheck.questionnaire.height!,
          units: undefined,
          isAbnormal: false,
          descriptiveText: 'someDescriptiveText',
          eventType: EmisEventType.Values
        }
      );
    });

    it('maps display term correctly when both value and unit are empty', async () => {
      const healthCheck = getMockHealthCheck();
      await genericMapper.mapConsultationElement(
        healthCheck,
        noValueAndUnitsSnomedCode.id,
        userId,
        false
      );

      sandbox.assert.calledWith(
        emisConsultationElementGenerationServiceStub.generateConsultationElement,
        {
          authorUserId: userId,
          header: noValueAndUnitsSnomedCode.headerTerm,
          term: noValueAndUnitsSnomedCode.fullSpecifiedName,
          displayTerm: noValueAndUnitsSnomedCode.fullSpecifiedName,
          date: '19/01/2024',
          time: '08:55:11',
          snomedCode: noValueAndUnitsSnomedCode.code,
          valueNumeric: undefined,
          units: undefined,
          isAbnormal: false,
          descriptiveText: undefined,
          eventType: EmisEventType.Values
        }
      );
    });

    it('maps ISO dates correctly when in daylight saving time', async () => {
      const healthCheck = getMockHealthCheck();
      await genericMapper.mapConsultationElement(
        {
          ...healthCheck,
          questionnaireCompletionDate: '2024-07-19T08:55:11.197Z'
        },
        heightSnomedCode.id,
        userId,
        false
      );

      sandbox.assert.alwaysCalledWithMatch(
        emisConsultationElementGenerationServiceStub.generateConsultationElement,
        {
          date: '19/07/2024',
          time: '09:55:11'
        } as unknown as ConsultationElementData
      );
    });

    it('returns latest biometric score date for BIOMETRIC_TEST_DATE', async () => {
      const healthCheck = getMockHealthCheck();

      await genericMapper.mapConsultationElement(
        healthCheck,
        biometricSnomedCode.id,
        userId,
        false
      );

      const [capturedArg] =
        emisConsultationElementGenerationServiceStub.generateConsultationElement.getCall(
          0
        ).args;

      expect(capturedArg.date).toBe('01/03/2023');
    });

    it('throws error when biometricScores is undefined', async () => {
      const healthCheck = {
        ...getMockHealthCheck(),
        biometricScores: undefined
      };

      await expect(
        async () =>
          await genericMapper.mapConsultationElement(
            healthCheck,
            biometricSnomedCode.id,
            userId,
            false
          )
      ).rejects.toThrow(
        'No biometric scores available to determine result date'
      );
    });

    it('throws error when biometricScores is empty array', async () => {
      const healthCheck = {
        ...getMockHealthCheck(),
        biometricScores: []
      };

      await expect(
        async () =>
          await genericMapper.mapConsultationElement(
            healthCheck,
            biometricSnomedCode.id,
            userId,
            false
          )
      ).rejects.toThrow(
        'No biometric scores available to determine result date'
      );
    });

    it('returns scoreCalculationDate for RISC_SCORE_CALCULATION_DATE', async () => {
      const healthCheck = getMockHealthCheck();

      await genericMapper.mapConsultationElement(
        healthCheck,
        riskSnomedCode.id,
        userId,
        false
      );

      const [capturedArg] =
        emisConsultationElementGenerationServiceStub.generateConsultationElement.getCall(
          0
        ).args;
      expect(capturedArg.date).toBe('01/05/2023');
    });

    it('throws error when riskScores is undefined', async () => {
      const healthCheck = {
        ...getMockHealthCheck(),
        riskScores: undefined
      };

      await expect(
        async () =>
          await genericMapper.mapConsultationElement(
            healthCheck,
            riskSnomedCode.id,
            userId,
            false
          )
      ).rejects.toThrow('No risk scores available to determine result date');
    });

    it('uses current date when resultDateSource is CURRENT_DATE', async () => {
      const now = new Date('2024-12-31T10:00:00.000Z');
      const clock = Sinon.useFakeTimers(now);

      const currentDateSnomedCode = {
        ...heightSnomedCode,
        id: 'currentDate',
        resultDateSource: ResultDateSource.CURRENT_DATE
      };
      snomedDbClientStub.getSnomedCode
        .withArgs(currentDateSnomedCode.id)
        .resolves(currentDateSnomedCode);

      const healthCheck = getMockHealthCheck();
      await genericMapper.mapConsultationElement(
        healthCheck,
        currentDateSnomedCode.id,
        userId,
        false
      );

      const [capturedArg] =
        emisConsultationElementGenerationServiceStub.generateConsultationElement.getCall(
          0
        ).args;

      expect(capturedArg.date).toBe('31/12/2024');

      clock.restore();
    });

    it('returns questionnaireCompletionDate when present', async () => {
      const healthCheck: IHealthCheck = {
        ...getMockHealthCheck(),
        questionnaireCompletionDate: '2024-02-01T07:30:00.000Z'
      } as unknown as IHealthCheck;

      await genericMapper.mapConsultationElement(
        healthCheck,
        heightSnomedCode.id,
        userId,
        false
      );

      const [capturedArg] =
        emisConsultationElementGenerationServiceStub.generateConsultationElement.getCall(
          0
        ).args;
      expect(capturedArg.date).toBe('01/02/2024');
    });

    it('uses current date when questionnaireCompletionDate is missing', async () => {
      const now = new Date('2024-12-25T10:00:00.000Z');
      const clock = Sinon.useFakeTimers(now);

      const healthCheck: IHealthCheck = {
        ...getMockHealthCheck(),
        questionnaireCompletionDate: undefined
      } as unknown as IHealthCheck;

      await genericMapper.mapConsultationElement(
        healthCheck,
        heightSnomedCode.id,
        userId,
        false
      );

      const [capturedArg] =
        emisConsultationElementGenerationServiceStub.generateConsultationElement.getCall(
          0
        ).args;
      expect(capturedArg.date).toBe('25/12/2024');

      clock.restore();
    });
    it('throws error for unsupported ResultDateSource', async () => {
      const healthCheck = getMockHealthCheck();

      await expect(
        async () =>
          await genericMapper.mapConsultationElement(
            healthCheck,
            invalidSnomedCode.id,
            userId,
            false
          )
      ).rejects.toThrow('Unsupported ResultDateSource');
    });
  });

  describe('mapConsultationComment', () => {
    it('maps a consultation with Comment header and expected structure', () => {
      const commentText = 'some text';
      genericMapper.mapConsultationComment(userId, commentText);

      sandbox.assert.notCalled(snomedDbClientStub.getSnomedCode);
      sandbox.assert.calledWith(
        emisConsultationElementGenerationServiceStub.generateConsultationElement,
        {
          authorUserId: userId,
          header: EmisHeaderTerm.Comment,
          date: '23/04/2024',
          isAbnormal: false,
          descriptiveText: commentText,
          eventType: EmisEventType.Values
        }
      );
    });
  });

  function getMockHealthCheck(): IHealthCheck {
    return {
      id: 'a6566c1a-a1fd-4605-a519-e597e23f36ed',
      createdAt: '2024-06-11T07:15:36.507Z',
      nhsNumber: '9993855774',
      questionnaire: {
        height: 170,
        heightDisplayPreference: 'cm',
        weight: 90,
        weightDisplayPreference: 'kg'
      },
      questionnaireCompletionDate: '2024-01-19T08:55:11.197Z',
      questionnaireScores: {
        auditScore: 0
      },
      biometricScores: [
        { date: '2023-01-01T08:00:00.000Z', scores: {} },
        { date: '2023-03-01T08:00:00.000Z', scores: {} }
      ],
      riskScores: {
        scoreCalculationDate: '2023-05-01T10:00:00.000Z'
      }
    } as unknown as IHealthCheck;
  }
});
