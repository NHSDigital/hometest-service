import { OrderService, OrderResultSummary } from './order-db';
import { OrderStatus, ResultStatus } from '../types/status';

describe('OrderService', () => {
    let dbClient: any;
    let orderService: OrderService;

    beforeEach(() => {
        dbClient = {
            query: jest.fn(),
        };
        orderService = new OrderService(dbClient);
    });

    describe('retrieveOrderDetails', () => {
        it('should return order details when found', async () => {
            const mockSummary: OrderResultSummary = {
                order_uid: 'order-123',
                order_reference: 'ref-456',
                supplier_id: 'supplier-789',
                patient_uid: 'patient-abc',
                result_status: 'RESULT_AVAILABLE',
                correlation_id: 'corr-xyz',
                order_status_code: 'COMPLETE',
            };
            dbClient.query.mockResolvedValue({ rows: [mockSummary] });

            const result = await orderService.retrieveOrderDetails('order-123');
            expect(dbClient.query).toHaveBeenCalledWith(expect.any(String), ['order-123']);
            expect(result).toEqual(mockSummary);
        });

        it('should return null when no order is found', async () => {
            dbClient.query.mockResolvedValue({ rows: [] });

            const result = await orderService.retrieveOrderDetails('order-404');
            expect(dbClient.query).toHaveBeenCalledWith(expect.any(String), ['order-404']);
            expect(result).toBeNull();
        });
    });

    describe('updateOrderStatusAndResultStatus', () => {
        it('should call dbClient.query with correct parameters', async () => {
            dbClient.query.mockResolvedValue({});
            await orderService.updateOrderStatusAndResultStatus(
                'order-1',
                'ref-1',
                OrderStatus.Complete,
                ResultStatus.Result_Available,
                'corr-1'
            );
            expect(dbClient.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO hometest.order_status'),
                ['order-1', 'ref-1', OrderStatus.Complete, ResultStatus.Result_Available, 'corr-1']
            );
        });
    });

    describe('updateResultStatus', () => {
        it('should call dbClient.query with correct parameters', async () => {
            dbClient.query.mockResolvedValue({});
            await orderService.updateResultStatus('order-2', ResultStatus.Result_Withheld, 'corr-2');
            expect(dbClient.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO hometest.result_status'),
                ['order-2', ResultStatus.Result_Withheld, 'corr-2']
            );
        });
    });
});
