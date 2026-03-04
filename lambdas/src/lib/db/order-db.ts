import { OrderStatus, ResultStatus } from "../types/status";
import { DBClient } from "./db-client";
import { Commons } from "../commons";
export interface OrderResultSummary {
    order_uid: string;
    order_reference: string;
    supplier_id: string;
    patient_uid: string;
    result_status: ResultStatus | null;
    correlation_id: string | null;
    order_status_code: OrderStatus | null;
}

export class OrderService {
    private readonly dbClient: DBClient;
    private readonly commons: Commons;
    constructor(dbClient: DBClient, commons: Commons) {
        this.dbClient = dbClient;
        this.commons = commons;
    }

    async retrieveOrderDetails(orderUid: string): Promise<OrderResultSummary | null> {
        const query = `
            SELECT o.order_uid, o.order_reference, o.supplier_id, o.patient_uid, r.status AS result_status, r.correlation_id, os.status_code AS order_status_code
                FROM test_order o
                LEFT JOIN result_status r ON o.order_uid = r.order_uid
                LEFT JOIN order_status os ON o.order_uid = os.order_uid
                WHERE o.order_uid = $1::uuid
                ORDER BY os.created_at DESC
                LIMIT 1;
        `;

        let result;
        try {
            result = await this.dbClient.query<OrderResultSummary, [string]>(query, [orderUid]);
        } catch (error) {
            this.commons.logError('order-db', 'Failed to retrieve order details', { error, orderUid });
            throw error;
        }
        return result.rows[0] || null;
    }

    async updateOrderStatusAndResultStatus(orderUid: string, orderReference: string, statusCode: OrderStatus, resultStatus: ResultStatus, correlationId: string): Promise<void> {
        try {
            await this.dbClient.withTransaction(async (tx) => {
                const orderStatusQuery = `
                INSERT INTO order_status (order_uid, order_reference, status_code, correlation_id)
                    VALUES ($1, $2, $3, $4)
                `;
                await tx.query(orderStatusQuery, [orderUid, orderReference, statusCode, correlationId]);

                const resultStatusQuery = `
                INSERT INTO result_status (order_uid, status, correlation_id)
                    VALUES ($1, $2, $3)
                `;
                await tx.query(resultStatusQuery, [orderUid, resultStatus, correlationId]);
            });
        } catch (error) {
            this.commons.logError('order-db', 'Failed to update order and result status', { error, orderUid });
            throw error;
        }
    }
}
