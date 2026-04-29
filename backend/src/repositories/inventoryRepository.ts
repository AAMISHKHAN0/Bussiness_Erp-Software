import { Pool, PoolClient } from 'pg';

/**
 * Handle database queries for Inventory Management - Repository Layer
 */
export class InventoryRepository {
    /**
     * Get stock levels with branch and product filters
     */
    static async findAll(db: Pool, filters: { branch_id?: string; product_id?: string }) {
        let query = `
      SELECT 
        i.id, i.quantity, i.last_updated,
        p.id as product_id, p.sku, p.name as product_name, p.min_stock_level,
        b.id as branch_id, b.name as branch_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN branches b ON i.branch_id = b.id
      WHERE 1=1
    `;
        const values: any[] = [];
        let paramIndex = 1;

        if (filters.branch_id) {
            query += ` AND i.branch_id = $${paramIndex}`;
            values.push(filters.branch_id);
            paramIndex++;
        }

        if (filters.product_id) {
            query += ` AND i.product_id = $${paramIndex}`;
            values.push(filters.product_id);
            paramIndex++;
        }

        query += ` ORDER BY p.name ASC, b.name ASC`;

        const result = await db.query(query, values);
        return result.rows;
    }

    /**
     * Record a stock movement log
     */
    static async recordMovement(db: Pool, movementData: any, client: PoolClient) {
        const { 
            product_id, branch_id, movement_type, quantity, 
            reference_type, reference_id, notes, created_by 
        } = movementData;

        const query = `
      INSERT INTO stock_movements 
        (product_id, branch_id, movement_type, quantity, reference_type, reference_id, notes, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;
        const values = [
            product_id, branch_id, movement_type, quantity, 
            reference_type || null, reference_id || null, notes || null, created_by
        ];

        const result = await client.query(query, values);
        return result.rows[0];
    }

    /**
     * Update/Upsert inventory levels
     */
    static async updateStock(db: Pool, productId: string, branchId: string, quantityChange: number, client: PoolClient) {
        const query = `
      INSERT INTO inventory (product_id, branch_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (product_id, branch_id) 
      DO UPDATE SET 
        quantity = inventory.quantity + EXCLUDED.quantity,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *
    `;
        const result = await client.query(query, [productId, branchId, quantityChange]);
        return result.rows[0];
    }

    /**
     * Get current stock for a product at a branch (optionally within a transaction)
     */
    static async getStockLevel(db: Pool, productId: string, branchId: string, client?: PoolClient) {
        const query = `SELECT quantity FROM inventory WHERE product_id = $1 AND branch_id = $2`;
        const executor = client ?? db;
        const result = await executor.query(query, [productId, branchId]);
        const qty = result.rows[0]?.quantity;
        return qty == null ? 0 : Number(qty);
    }
}
