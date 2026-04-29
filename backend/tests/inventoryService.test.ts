import { InventoryService } from '../src/services/inventoryService';
import { InventoryRepository } from '../src/repositories/inventoryRepository';

jest.mock('../src/repositories/inventoryRepository', () => ({
    InventoryRepository: {
        getStockLevel: jest.fn(),
        recordMovement: jest.fn(),
        updateStock: jest.fn(),
    },
}));

describe('InventoryService.recordMovement', () => {
    const mockPool = { connect: jest.fn() } as unknown as import('pg').Pool;

    const mockClient = {
        query: jest.fn(async (sql: string) => {
            if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)) return { rows: [] };
            return { rows: [] };
        }),
        release: jest.fn(),
    };

    const movementPayload = {
        product_id: 'p1',
        branch_id: 'b1',
        movement_type: 'OUT' as const,
        quantity: 5,
        created_by: 'u1',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
    });

    it('rejects OUT when stock is insufficient', async () => {
        (InventoryRepository.getStockLevel as jest.Mock).mockResolvedValue(1);

        await expect(
            InventoryService.recordMovement(mockPool, { ...movementPayload, quantity: 5 })
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(InventoryRepository.recordMovement).not.toHaveBeenCalled();
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('allows OUT when stock is sufficient', async () => {
        (InventoryRepository.getStockLevel as jest.Mock).mockResolvedValue(10);
        (InventoryRepository.recordMovement as jest.Mock).mockResolvedValue({ id: 'm1' });
        (InventoryRepository.updateStock as jest.Mock).mockResolvedValue({ quantity: 5 });

        const result = await InventoryService.recordMovement(mockPool, {
            product_id: 'p1',
            branch_id: 'b1',
            movement_type: 'OUT',
            quantity: 3,
            created_by: 'u1',
        });

        expect(result.new_stock_level).toEqual({ quantity: 5 });
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
});
