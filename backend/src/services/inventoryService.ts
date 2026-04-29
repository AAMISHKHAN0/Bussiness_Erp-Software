import { InventoryRepository } from '../repositories/inventoryRepository';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { Pool } from "pg";

export class InventoryService {
    /**
     * Get stock levels with branch and product filters
     */
    static async getInventory(db: Pool, filters: { branch_id?: string; product_id?: string }) {
        return await InventoryRepository.findAll(db, filters);
    }

    /**
     * Record a stock movement (Atomic Transaction)
     */
    static async recordMovement(db: Pool, movementData: any) {
        const { product_id, branch_id, movement_type, quantity, reference_type, reference_id, notes, created_by } = movementData;

        if (!['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'].includes(movement_type)) {
            throw ApiError.badRequest('Invalid movement_type');
        }

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            throw ApiError.badRequest('Quantity must be a positive number');
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // 1. Determine quantity modifier for the ledger
            let quantityChange = qty;
            if (movement_type === 'OUT') {
                // Check if enough stock exists for "OUT" movements
                const currentStock = await InventoryRepository.getStockLevel(db, product_id, branch_id);
                if (currentStock < qty) {
                    throw ApiError.badRequest(`Insufficient stock at this branch. Current: ${currentStock}, Requested: ${qty}`);
                }
                quantityChange = -qty;
            } else if (movement_type === 'ADJUSTMENT' && notes?.toLowerCase().includes('negative')) {
                quantityChange = -qty;
            }

            // 2. Record the movement log
            const movement = await InventoryRepository.recordMovement(db, {
                product_id, branch_id, movement_type, quantity: qty,
                reference_type, reference_id, notes, created_by
            }, client);

            // 3. Upsert inventory levels
            const inventory = await InventoryRepository.updateStock(db, product_id, branch_id, quantityChange, client);

            await client.query('COMMIT');

            return {
                movement,
                new_stock_level: inventory
            };
        } catch (error: any) {
            await client.query('ROLLBACK');
            logger.error('Failed to record stock movement', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }
}
