import { DBClient } from "./db-client";

export interface OrderResultSummary {
    order_uid: string;
    supplier_id: string;
    patient_uid: string;
    result_status: string;
    correlation_id: string;
    order_status_code: string;
}

export class OrderService {
    private readonly dbClient: DBClient;
    constructor(dbClient: DBClient) {
        this.dbClient = dbClient;
    }

    async retrieveOrderDetails(orderUid: string): Promise<OrderResultSummary | null> {
        const query = `
            SELECT o.order_uid, o.supplier_id, o.patient_uid, r.status AS result_status, r.correlation_id, os.status_code AS order_status_code
                FROM hometest.test_order o
                LEFT JOIN hometest.result_status r ON o.order_uid = r.order_uid
                LEFT JOIN hometest.order_status os ON o.order_uid = os.order_uid
                WHERE o.order_uid = $1;
        `;

        const result = await this.dbClient.query<OrderResultSummary, [string]>(query, [orderUid]);
        return result.rows[0] || null;
    }

    async updateOrderStatusAndResultStatus(orderUid: string, statusCode: string, resultStatus: string, correlationId: string) { //TODO: can conflict clause be triggered? order_uid is not unique in result status table (should it be?). Would it just create new record?
        const query = `
            BEGIN;
            UPDATE hometest.order_status os
                SET status_code = $2
                FROM hometest.test_order o
                WHERE os.order_uid = o.order_uid
                AND o.order_uid = $1;
            INSERT INTO hometest.result_status (order_uid, status, correlation_id)
                VALUES ($1, $3, $4)
                ON CONFLICT (order_uid) DO UPDATE SET status = EXCLUDED.status, correlation_id = EXCLUDED.correlation_id;
            COMMIT;
        `;

        await this.dbClient.query(query, [orderUid, statusCode, resultStatus, correlationId]);
    }

    async updateResultStatus(orderUid: string, resultStatus: string, correlationId: string) {
        const query = `
            INSERT INTO hometest.result_status (order_uid, status, correlation_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (order_uid) DO UPDATE SET status = EXCLUDED.status, correlation_id = EXCLUDED.correlation_id;
        `;

        await this.dbClient.query(query, [orderUid, resultStatus, correlationId]);
    }
}
