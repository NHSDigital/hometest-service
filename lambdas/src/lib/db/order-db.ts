import { OrderStatus, ResultStatus } from "../types/status";
import { DBClient } from "./db-client";

export interface OrderResultSummary {
    order_uid: string;
    order_reference: string;
    supplier_id: string;
    patient_uid: string;
    result_status: ResultStatus | null;
    correlation_id: string;
    order_status_code: OrderStatus | null;
}

export class OrderService {
    private readonly dbClient: DBClient;
    constructor(dbClient: DBClient) {
        this.dbClient = dbClient;
    }

    async retrieveOrderDetails(orderUid: string): Promise<OrderResultSummary | null> {
        const query = `
            SELECT o.order_uid, o.order_reference, o.supplier_id, o.patient_uid, r.status AS result_status, r.correlation_id, os.status_code AS order_status_code
                FROM hometest.test_order o
                LEFT JOIN hometest.result_status r ON o.order_uid = r.order_uid
                LEFT JOIN hometest.order_status os ON o.order_uid = os.order_uid
                WHERE o.order_uid = $1
                ORDER BY os.created_at DESC
                LIMIT 1;
        `;

        const result = await this.dbClient.query<OrderResultSummary, [string]>(query, [orderUid]);
        return result.rows[0] || null;
    }

    async updateOrderStatusAndResultStatus(orderUid: string, orderReference: string, statusCode: OrderStatus, resultStatus: ResultStatus, correlationId: string) {
        await this.dbClient.withTransaction(async (tx) => {
            const orderStatusQuery = `
            INSERT INTO hometest.order_status (order_uid, order_reference, status_code, correlation_id)
                VALUES ($1, $2, $3, $4)
            `;
            await tx.query(orderStatusQuery, [orderUid, orderReference, statusCode, correlationId]);

            const resultStatusQuery = `
            INSERT INTO hometest.result_status (order_uid, status, correlation_id)
                VALUES ($1, $2, $3)
            `;
            await tx.query(resultStatusQuery, [orderUid, resultStatus, correlationId]);
        });
    }

    async updateResultStatus(orderUid: string, resultStatus: ResultStatus, correlationId: string) {
        const query = `
            INSERT INTO hometest.result_status (order_uid, status, correlation_id)
                VALUES ($1, $2, $3)
        `;

        await this.dbClient.query(query, [orderUid, resultStatus, correlationId]);
    }
}
