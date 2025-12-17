import Sinon from 'ts-sinon';
import * as uuid from 'uuid';
import { EmisConsultationElementGenerationService } from '../../../../src/lib/emis/consultation-generation/emis-consultation-element-generation-service';
import { Commons } from '../../../../src/lib/commons';
import {
  EmisEventType,
  EmisHeaderTerm,
  EmisSchema
} from '../../../../src/lib/emis/consultation-generation/emis-consultation-model';

jest.mock('uuid');
const mockUUID = 'mockUUID';
jest.spyOn(uuid, 'v4').mockReturnValue(mockUUID);

describe('EmisConsultationElementGenerationService', () => {
  const sandbox = Sinon.createSandbox();
  const nhcVersion = 'nhcVersion';
  const basicParams = {
    authorUserId: '123123',
    header: EmisHeaderTerm.Examination,
    date: '20/01/2024',
    isAbnormal: false,
    eventType: EmisEventType.Values
  };
  const basicExpectedObject = {
    RefID: { '#': '1' },
    Header: {
      Term: { '#': basicParams.header }
    },
    Event: {
      RefID: { '#': '1' },
      GUID: { '#': mockUUID },
      AssignedDate: { '#': basicParams.date },
      AuthorID: {
        RefID: { '#': basicParams.authorUserId.toString() }
      },
      OriginalAuthor: {
        User: {
          RefID: { '#': basicParams.authorUserId.toString() }
        }
      },
      Abnormal: 0,
      EventType: basicParams.eventType
    }
  };
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;

  let service: EmisConsultationElementGenerationService;

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    commonsStub.nhcVersion = nhcVersion;

    service = new EmisConsultationElementGenerationService(
      commonsStub as unknown as Commons
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('generateConsultationElement', () => {
    it('maps a basic segment to correct structure', async () => {
      const consultation = service.generateConsultationElement(basicParams);
      expect(consultation).toEqual(basicExpectedObject);
    });

    it('adds a ProblemSection if supplied', async () => {
      const consultation = service.generateConsultationElement({
        problemSection: 5,
        ...basicParams
      });
      expect(consultation).toEqual({
        ProblemSection: 5,
        ...basicExpectedObject
      });
    });

    it('adds DescriptiveText node if supplied', async () => {
      const consultation = service.generateConsultationElement({
        descriptiveText: 'Some descriptive text',
        ...basicParams
      });
      expect(consultation.Event).toEqual({
        ...basicExpectedObject.Event,
        DescriptiveText: { '#': 'Some descriptive text' }
      });
    });

    it('adds DisplayOrder if supplied', async () => {
      const consultation = service.generateConsultationElement({
        displayOrder: 3,
        ...basicParams
      });
      expect(consultation).toEqual({
        DisplayOrder: 3,
        ...basicExpectedObject
      });
    });

    it('adds NumericValue if supplied', async () => {
      const consultation = service.generateConsultationElement({
        valueNumeric: 170,
        units: 'cm',
        ...basicParams
      });
      expect(consultation.Event).toEqual({
        NumericValue: {
          Value: 170,
          Units: { '#': 'cm' }
        },
        ...basicExpectedObject.Event
      });
    });

    it('adds AssignedTime if supplied', async () => {
      const time = '10:50:11';

      const consultation = service.generateConsultationElement({
        time,
        ...basicParams
      });
      expect(consultation.Event).toEqual({
        AssignedTime: { '#': time },
        ...basicExpectedObject.Event
      });
    });

    it('adds DisplayTerm if supplied', async () => {
      const displayTerm = `Body height, 170 cm`;

      const consultation = service.generateConsultationElement({
        displayTerm,
        ...basicParams
      });
      expect(consultation.Event).toEqual({
        DisplayTerm: { '#': displayTerm },
        ...basicExpectedObject.Event
      });
    });

    it('adds Code and TermID if supplied', async () => {
      const term = 'Body height';
      const snomedCode = '1153637007';

      const consultation = service.generateConsultationElement({
        term,
        snomedCode,
        ...basicParams
      });
      expect(consultation.Event).toEqual({
        Code: {
          Value: { '#': snomedCode },
          Scheme: { '#': EmisSchema.SNOMED },
          Term: { '#': term }
        },
        TermID: {
          Value: { '#': snomedCode },
          Scheme: { '#': EmisSchema.SNOMED },
          Term: { '#': term }
        },
        ...basicExpectedObject.Event
      });
    });
  });
});
