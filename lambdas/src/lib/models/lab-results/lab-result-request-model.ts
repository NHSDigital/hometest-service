import { type BiomarkerCode } from '@dnhc-health-checks/shared';

export interface ILabResultRequestModel {
  orderId: string;
  orderExternalReference: string;
  pendingReorder: boolean;
  resultData: ILabResultDataRequestModel[];
  resultDate: string;
}

export interface ILabResultDataRequestModel {
  biomarkerCode: BiomarkerCode;
  units: string;
  value?: number | null;
  successful: boolean;
  failureReasonCode?: string;
  failureReasonDescription?: string;
}
