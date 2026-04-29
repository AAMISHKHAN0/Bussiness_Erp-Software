import { Pool, PoolClient } from 'pg';

/**
 * Handle database queries for Product Management - Repository Layer
 */
export class ProductRepository {
    /**
     * Get all products with filters
     */
    static async findAll(db: Pool, filters: { category_id?: string; search?: string }) {
        let query = `
      SELECT 
        p.id, p.sku, p.name, p.description, p.base_price, p.unit_of_measure, 
        p.min_stock_level, p.is_active,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = true
    `;
        const values: any[] = [];
        let paramIndex = 1;

        if (filters.category_id) {
            query += ` AND p.category_id = $${paramIndex}`;
            values.push(filters.category_id);
            paramIndex++;
        }

        if (filters.search) {
            query += ` AND (p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`;
            values.push(`%${filters.search}%`);
            paramIndex++;
        }

        query += ` ORDER BY p.name ASC`;

        const result = await db.query(query, values);
        return result.rows;
    }

    /**
     * Find product by ID with details
     */
    static async findById(db: Pool, id: string) {
        const query = `
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = $1
    `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Create a product within a transaction
     */
    static async create(db: Pool, productData: any, client: PoolClient) {
        const {
            sku, name, description, category_id, supplier_id,
            base_price, cost_price, tax_rate, brand, barcode,
            is_active, image_url, unit_of_measure, min_stock_level
        } = productData;

        const query = `
      INSERT INTO products 
        (sku, name, description, category_id, supplier_id, base_price, cost_price, tax_rate, brand, barcode, is_active, image_url, unit_of_measure, min_stock_level) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING *
    `;
        const values = [
            sku, name, description || null, category_id || null, supplier_id || null, 
            base_price, cost_price || 0, tax_rate || 0, brand || null, barcode || null, 
            is_active !== undefined ? is_active : true, image_url || null, 
            unit_of_measure || 'pcs', min_stock_level || 0
        ];

        const result = await client.query(query, values);
        return result.rows[0];
    }

    /**
     * Update a product
     */
    static async update(db: Pool, id: string, productData: any) {
        const {
            sku, name, description, category_id, supplier_id,
            base_price, cost_price, tax_rate, brand, barcode,
            is_active, image_url, unit_of_measure, min_stock_level
        } = productData;

        const query = `
      UPDATE products
      SET sku = $1, name = $2, description = $3, category_id = $4, supplier_id = $5,
          base_price = $6, cost_price = $7, tax_rate = $8, brand = $9, barcode = $10,
          is_active = $11, image_url = $12, unit_of_measure = $13, min_stock_level = $14,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `;
        const values = [
            sku, name, description || null, category_id || null, supplier_id || null, 
            base_price, cost_price || 0, tax_rate || 0, brand || null, barcode || null, 
            is_active !== undefined ? is_active : true, image_url || null, 
            unit_of_measure || 'pcs', min_stock_level || 0, id
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Initialize inventory for a new product
     */
    static async initializeInventory(db: Pool, productId: string, branchId: string, quantity: number, client: PoolClient) {
        const query = `
      INSERT INTO inventory (product_id, branch_id, quantity)
      VALUES ($1, $2, $3)
    `;
        await client.query(query, [productId, branchId, quantity]);
    }

    /**
     * Update/Upsert inventory
     */
    static async upsertInventory(db: Pool, productId: string, branchId: string, quantity: number) {
        const query = `
      INSERT INTO inventory (product_id, branch_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (product_id, branch_id)
      DO UPDATE SET 
          quantity = $3,
          last_updated = CURRENT_TIMESTAMP
    `;
        await db.query(query, [productId, branchId, quantity]);
    }

    /**
     * Soft-delete a product
     */
    static async deactivate(db: Pool, id: string) {
        const query = `UPDATE products SET is_active = false WHERE id = $1 RETURNING id, name`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}
