import { LabTestType, BiomarkerCode } from './enum/lab-result';

export interface ILabResult {
  orderId: string;
  fulfilmentOrderId: string;
  /**
   * The type of test in format `testType#uuid`
   *
   * For example: Cholesterol#b9b1e7c0-0cbb-4a0f-b241-6b89e7f987d9
   */
  testType: string;
  receivedAt: string;
  resultDate: string;
  pendingReorder: boolean;
  resultData: ILabResultData[];
  healthCheckId: string;
  patientId: string;
  provider: string;
}

export function getExtractedLabTestType(labResult: ILabResult): LabTestType {
  const testTypeKey = labResult.testType.includes('#')
    ? labResult.testType.split('#')[0]
    : labResult.testType;

  return LabTestType[testTypeKey as keyof typeof LabTestType] ?? undefined;
}

export interface ILabResultData {
  biomarkerCode: BiomarkerCode;
  units?: string;
  value?: number | null;
  successful: boolean;
  failureReasonCode?: string;
  failureReasonDescription?: string;
}

export const labTestTypeToBiomarkerCodesMapping: Record<
  LabTestType,
  BiomarkerCode[]
> = {
  [LabTestType.HbA1c]: [BiomarkerCode.GHBI],
  [LabTestType.Cholesterol]: [
    BiomarkerCode.CHO,
    BiomarkerCode.HDL,
    BiomarkerCode.CHDD
  ]
};
