/** Types generated for queries found in "src/lib/db/queries/getPatientIdFromOrder.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetPatientIdFromOrder' parameters type */
export interface IGetPatientIdFromOrderParams {
  order_uid?: string | null | void;
}

/** 'GetPatientIdFromOrder' return type */
export interface IGetPatientIdFromOrderResult {
  patient_uid: string;
}

/** 'GetPatientIdFromOrder' query type */
export interface IGetPatientIdFromOrderQuery {
  params: IGetPatientIdFromOrderParams;
  result: IGetPatientIdFromOrderResult;
}

const getPatientIdFromOrderIR: any = {"usedParamSet":{"order_uid":true},"params":[{"name":"order_uid","required":false,"transform":{"type":"scalar"},"locs":[{"a":62,"b":71}]}],"statement":"SELECT patient_uid\nFROM hometest.test_order\nWHERE order_uid = :order_uid::uuid\nLIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT patient_uid
 * FROM hometest.test_order
 * WHERE order_uid = :order_uid::uuid
 * LIMIT 1
 * ```
 */
export const getPatientIdFromOrder = new PreparedQuery<IGetPatientIdFromOrderParams,IGetPatientIdFromOrderResult>(getPatientIdFromOrderIR);


