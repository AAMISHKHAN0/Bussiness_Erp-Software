import { SalesOrderService } from '../src/services/salesOrderService';
import { InventoryRepository } from '../src/repositories/inventoryRepository';
import { SalesOrderRepository } from '../src/repositories/salesOrderRepository';

jest.mock('../src/repositories/inventoryRepository', () => ({
    InventoryRepository: {
        getStockLevel: jest.fn(),
        updateStock: jest.fn(),
    },
}));

jest.mock('../src/repositories/salesOrderRepository', () => ({
    SalesOrderRepository: {
        createHeader: jest.fn(),
        createItem: jest.fn(),
        recordTransaction: jest.fn(),
    },
}));

describe('SalesOrderService.createOrder', () => {
    const mockPool = { connect: jest.fn() } as unknown as import('pg').Pool;

    const mockClient = {
        query: jest.fn(async (sql: string) => {
            if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)) return { rows: [] };
            return { rows: [] };
        }),
        release: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
    });

    it('rejects when aggregate quantity exceeds stock', async () => {
        (InventoryRepository.getStockLevel as jest.Mock).mockResolvedValue(2);

        await expect(
            SalesOrderService.createOrder(
                mockPool,
                {
                    customer_id: 'c1',
                    branch_id: 'b1',
                    items: [
                        { product_id: 'p1', quantity: 2, unit_price: 10 },
                        { product_id: 'p1', quantity: 2, unit_price: 5 },
                    ],
                },
                'u1'
            )
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(SalesOrderRepository.createHeader).not.toHaveBeenCalled();
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('creates order when stock is sufficient', async () => {
        (InventoryRepository.getStockLevel as jest.Mock).mockResolvedValue(100);
        (SalesOrderRepository.createHeader as jest.Mock).mockResolvedValue({
            id: 'ord-1',
            order_number: 'SO-TEST-1',
        });
        (InventoryRepository.updateStock as jest.Mock).mockResolvedValue({});
        (SalesOrderRepository.createItem as jest.Mock).mockResolvedValue(undefined);
        (SalesOrderRepository.recordTransaction as jest.Mock).mockResolvedValue(undefined);

        const order = await SalesOrderService.createOrder(
            mockPool,
            {
                customer_id: 'c1',
                branch_id: 'b1',
                items: [{ product_id: 'p1', quantity: 1, unit_price: 10 }],
            },
            'u1'
        );

        expect(order.id).toBe('ord-1');
        expect(InventoryRepository.updateStock).toHaveBeenCalledWith(mockPool, 'p1', 'b1', -1, mockClient);
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('rejects invalid line quantities before transaction', async () => {
        await expect(
            SalesOrderService.createOrder(
                mockPool,
                {
                    customer_id: 'c1',
                    branch_id: 'b1',
                    items: [{ product_id: 'p1', quantity: 'x', unit_price: 10 }],
                },
                'u1'
            )
        ).rejects.toMatchObject({ statusCode: 400 });
        expect(mockPool.connect).not.toHaveBeenCalled();
    });
});
