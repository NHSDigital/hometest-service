import {
  type ILabResult,
  type ILabResultData
} from '../../../../shared/model/lab-result';
import {
  LabTestType,
  BiomarkerCode
} from '../../../../shared/model/enum/lab-result';
import { Provider } from '../../../../shared/model/lab-order';
import { v4 as uuidv4 } from 'uuid';

export class MockLabResultsBuilder {
  private static readonly TEST_FAILURE_REASON_CODE = 'error_code';
  private static readonly TEST_FAILURE_REASON_DESCRIPTION = 'error_description';

  private readonly labResult: Partial<ILabResult> = {};

  setOrderId(orderId: string): this {
    this.labResult.orderId = orderId;
    return this;
  }

  setFulfilmentOrderId(fulfilmentOrderId: string): this {
    this.labResult.fulfilmentOrderId = fulfilmentOrderId;
    return this;
  }

  setTestType(testType: string): this {
    this.labResult.testType = testType;
    return this;
  }

  setReceivedAt(receivedAt: string): this {
    this.labResult.receivedAt = receivedAt;
    return this;
  }

  setResultDate(resultDate: string): this {
    this.labResult.resultDate = resultDate;
    return this;
  }

  setPendingReorder(pendingReorder: boolean): this {
    this.labResult.pendingReorder = pendingReorder;
    return this;
  }

  setResultData(resultData: ILabResultData[]): this {
    this.labResult.resultData = resultData;
    return this;
  }

  setHealthCheckId(healthCheckId: string): this {
    this.labResult.healthCheckId = healthCheckId;
    return this;
  }

  setPatientId(patientId: string): this {
    this.labResult.patientId = patientId;
    return this;
  }

  setProvider(provider: string): this {
    this.labResult.provider = provider;
    return this;
  }

  build(): ILabResult {
    return this.labResult as ILabResult;
  }

  clone(): MockLabResultsBuilder {
    const clone = new MockLabResultsBuilder();
    Object.assign(clone.labResult, this.labResult);
    return clone;
  }

  private static basicLabResult(): MockLabResultsBuilder {
    const now = new Date().toISOString();
    return new MockLabResultsBuilder()
      .setReceivedAt(now)
      .setResultDate(now)
      .setPendingReorder(false)
      .setProvider(Provider.Thriva);
  }

  static cholesterolLabResult(
    cho: number | null,
    hdl: number | null,
    chdd: number | null
  ) {
    return this.basicLabResult()
      .setTestType(`${LabTestType.Cholesterol}#${uuidv4()}`)
      .setResultData([
        {
          biomarkerCode: BiomarkerCode.CHO,
          units: 'mmol/L',
          value: cho,
          successful: cho !== null,
          ...(cho === null && {
            failureReasonCode: this.TEST_FAILURE_REASON_CODE,
            failureReasonDescription: this.TEST_FAILURE_REASON_DESCRIPTION
          })
        },
        {
          biomarkerCode: BiomarkerCode.HDL,
          units: 'mmol/L',
          value: hdl,
          successful: hdl !== null,
          ...(hdl === null && {
            failureReasonCode: this.TEST_FAILURE_REASON_CODE,
            failureReasonDescription: this.TEST_FAILURE_REASON_DESCRIPTION
          })
        },
        {
          biomarkerCode: BiomarkerCode.CHDD,
          units: 'mmol/L',
          value: chdd,
          successful: chdd !== null,
          ...(chdd === null && {
            failureReasonCode: this.TEST_FAILURE_REASON_CODE,
            failureReasonDescription: this.TEST_FAILURE_REASON_DESCRIPTION
          })
        }
      ]);
  }

  static diabetesLabResult(ghbi: number | null): MockLabResultsBuilder {
    return this.basicLabResult()
      .setTestType(`${LabTestType.HbA1c}#${uuidv4()}`)
      .setResultData([
        {
          biomarkerCode: BiomarkerCode.GHBI,
          units: 'mmol/L',
          value: ghbi,
          successful: ghbi !== null,
          ...(ghbi === null && {
            failureReasonCode: this.TEST_FAILURE_REASON_CODE,
            failureReasonDescription: this.TEST_FAILURE_REASON_DESCRIPTION
          })
        }
      ]);
  }

  static basicCholesterolLabResult(): MockLabResultsBuilder {
    return this.cholesterolLabResult(4.0, 0.9, 4.4);
  }

  static basicDiabetesLabResult(): MockLabResultsBuilder {
    return this.diabetesLabResult(41);
  }

  static basicLabResults(): ILabResult[] {
    return [
      this.basicCholesterolLabResult().clone().build(),
      this.basicDiabetesLabResult().clone().build()
    ];
  }
}
