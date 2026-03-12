/** Types generated for queries found in "src/lib/db/queries/checkIdompotency.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'CheckIdempotency' parameters type */
export interface ICheckIdempotencyParams {
  correlation_id?: string | null | void;
  order_uid?: string | null | void;
}

/** 'CheckIdempotency' return type */
export interface ICheckIdempotencyResult {
  exists: number | null;
}

/** 'CheckIdempotency' query type */
export interface ICheckIdempotencyQuery {
  params: ICheckIdempotencyParams;
  result: ICheckIdempotencyResult;
}

const checkIdempotencyIR: any = {"usedParamSet":{"order_uid":true,"correlation_id":true},"params":[{"name":"order_uid","required":false,"transform":{"type":"scalar"},"locs":[{"a":64,"b":73}]},{"name":"correlation_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":102,"b":116}]}],"statement":"SELECT 1 AS exists\nFROM hometest.order_status\nWHERE order_uid = :order_uid::uuid\nAND correlation_id = :correlation_id::uuid\nLIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT 1 AS exists
 * FROM hometest.order_status
 * WHERE order_uid = :order_uid::uuid
 * AND correlation_id = :correlation_id::uuid
 * LIMIT 1
 * ```
 */
export const checkIdempotency = new PreparedQuery<ICheckIdempotencyParams,ICheckIdempotencyResult>(checkIdempotencyIR);


