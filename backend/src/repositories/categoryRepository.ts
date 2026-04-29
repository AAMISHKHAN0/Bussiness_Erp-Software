import { Pool } from "pg";

/**
 * Handle database queries for Category Management - Repository Layer
 */
export class CategoryRepository {
    /**
     * Get all active categories
     */
    static async findAllActive(db: Pool) {
        const query = `
      SELECT id, name, description, parent_id, is_active, created_at 
      FROM product_categories 
      WHERE is_active = true
      ORDER BY name ASC
    `;
        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Find category by ID
     */
    static async findById(db: Pool, id: string) {
        const query = `SELECT * FROM product_categories WHERE id = $1`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Create a category
     */
    static async create(db: Pool, data: any) {
        const { name, description, parent_id, is_active } = data;
        const query = `
      INSERT INTO product_categories (name, description, parent_id, is_active) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `;
        const values = [name, description, parent_id || null, is_active !== undefined ? is_active : true];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Update a category
     */
    static async update(db: Pool, id: string, data: any) {
        const { name, description, parent_id, is_active } = data;
        const query = `
      UPDATE product_categories 
      SET name = $1, description = $2, parent_id = $3, is_active = $4 
      WHERE id = $5 
      RETURNING *
    `;
        const values = [name, description, parent_id || null, is_active !== undefined ? is_active : true, id];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Delete a category
     */
    static async delete(db: Pool, id: string) {
        const query = `DELETE FROM product_categories WHERE id = $1 RETURNING id`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Check if category has products
     */
    static async hasProducts(db: Pool, id: string) {
        const query = `SELECT id FROM products WHERE category_id = $1 LIMIT 1`;
        const result = await db.query(query, [id]);
        return result.rows.length > 0;
    }

    /**
     * Check if category has children
     */
    static async hasChildren(db: Pool, id: string) {
        const query = `SELECT id FROM product_categories WHERE parent_id = $1 LIMIT 1`;
        const result = await db.query(query, [id]);
        return result.rows.length > 0;
    }
}
