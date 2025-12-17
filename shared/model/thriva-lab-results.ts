import type { ILabResultData } from './lab-result';

export interface IThrivaLabResults {
  orderId: string;
  orderExternalReference: string;
  pendingReorder: boolean;
  resultDate: string;
  resultData: ILabResultData[];
}
