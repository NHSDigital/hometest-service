/** Types generated for queries found in "src/lib/db/queries/addOrderStatusUpdate.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type DateOrString = Date | string;

/** 'AddOrderStatusUpdate' parameters type */
export interface IAddOrderStatusUpdateParams {
  correlation_id?: string | null | void;
  created_at?: DateOrString | null | void;
  order_uid?: string | null | void;
  status_code?: string | null | void;
}

/** 'AddOrderStatusUpdate' return type */
export type IAddOrderStatusUpdateResult = void;

/** 'AddOrderStatusUpdate' query type */
export interface IAddOrderStatusUpdateQuery {
  params: IAddOrderStatusUpdateParams;
  result: IAddOrderStatusUpdateResult;
}

const addOrderStatusUpdateIR: any = {"usedParamSet":{"order_uid":true,"status_code":true,"created_at":true,"correlation_id":true},"params":[{"name":"order_uid","required":false,"transform":{"type":"scalar"},"locs":[{"a":95,"b":104}]},{"name":"status_code","required":false,"transform":{"type":"scalar"},"locs":[{"a":113,"b":124}]},{"name":"created_at","required":false,"transform":{"type":"scalar"},"locs":[{"a":133,"b":143}]},{"name":"correlation_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":159,"b":173}]}],"statement":"INSERT INTO hometest.order_status (order_uid, status_code, created_at, correlation_id)\nVALUES (:order_uid::uuid, :status_code::text, :created_at::timestamptz, :correlation_id::uuid)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO hometest.order_status (order_uid, status_code, created_at, correlation_id)
 * VALUES (:order_uid::uuid, :status_code::text, :created_at::timestamptz, :correlation_id::uuid)
 * ```
 */
export const addOrderStatusUpdate = new PreparedQuery<IAddOrderStatusUpdateParams,IAddOrderStatusUpdateResult>(addOrderStatusUpdateIR);


