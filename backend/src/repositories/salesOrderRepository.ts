import { Pool, PoolClient } from 'pg';

/**
 * Handle database queries for Sales Orders - Repository Layer
 */
export class SalesOrderRepository {
    /**
     * Get all sales orders with customer and rep info
     */
    static async findAll(db: Pool) {
        const query = `
      SELECT 
        so.id, so.order_number, so.status, so.total_amount, so.created_at,
        c.name as customer_name,
        u.first_name as sales_rep_first_name, u.last_name as sales_rep_last_name
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      LEFT JOIN users u ON so.created_by = u.id
      ORDER BY so.created_at DESC
      LIMIT 100
    `;
        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Find order by ID with customer and branch details
     */
    static async findById(db: Pool, id: string) {
        const query = `
      SELECT 
        so.*,
        c.name as customer_name, c.email as customer_email, c.address as customer_address,
        b.name as branch_name
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      LEFT JOIN branches b ON so.branch_id = b.id
      WHERE so.id = $1
    `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Get items for a sales order
     */
    static async findItemsByOrderId(db: Pool, orderId: string) {
        const query = `
      SELECT soi.*, p.name as product_name, p.sku
      FROM sales_order_items soi
      JOIN products p ON soi.product_id = p.id
      WHERE soi.sales_order_id = $1
    `;
        const result = await db.query(query, [orderId]);
        return result.rows;
    }

    /**
     * Create Sales Order Header
     */
    static async createHeader(db: Pool, data: any, client: PoolClient) {
        const { 
            order_number, customer_id, branch_id, status, 
            total_amount, tax_amount, discount_amount, net_amount, 
            notes, created_by 
        } = data;

        const query = `
      INSERT INTO sales_orders 
        (order_number, customer_id, branch_id, status, total_amount, tax_amount, discount_amount, net_amount, notes, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *
    `;
        const values = [
            order_number, customer_id, branch_id, status || 'draft', 
            total_amount, tax_amount || 0, discount_amount || 0, net_amount || total_amount, 
            notes || null, created_by
        ];

        const result = await client.query(query, values);
        return result.rows[0];
    }

    /**
     * Create Sales Order Item
     */
    static async createItem(db: Pool, item: any, client: PoolClient) {
        const { sales_order_id, product_id, quantity, unit_price, subtotal } = item;
        const query = `
      INSERT INTO sales_order_items 
        (sales_order_id, product_id, quantity, unit_price, subtotal) 
      VALUES ($1, $2, $3, $4, $5)
    `;
        await client.query(query, [sales_order_id, product_id, quantity, unit_price, subtotal]);
    }

    /**
     * Update order status
     */
    static async updateStatus(db: Pool, id: string, status: string, client?: PoolClient) {
        const query = `UPDATE sales_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`;
        const executor = client || db;
        const result = await executor.query(query, [status, id]);
        return result.rows[0];
    }

    /**
     * Delete order items (used for full update)
     */
    static async deleteItems(db: Pool, orderId: string, client: PoolClient) {
        await client.query('DELETE FROM sales_order_items WHERE sales_order_id = $1', [orderId]);
    }

    /**
     * Record accounting transaction for the sale
     */
    static async recordTransaction(db: Pool, data: any, client: PoolClient) {
        const { date, description, amount, debit_account, credit_account } = data;
        const query = `
      INSERT INTO transactions (transaction_date, description, amount, debit_account_name, credit_account_name) 
      VALUES ($1, $2, $3, $4, $5)
    `;
        await client.query(query, [date, description, amount, debit_account, credit_account]);
    }
}
