import { Pool } from "pg";

/**
 * Handle database queries for Customer Management - Repository Layer
 */
export class CustomerRepository {
    /**
     * Get all active customers with search
     */
    static async findAll(db: Pool, filters: { search?: string }) {
        let query = `
      SELECT 
        c.id, c.name, c.email, c.phone, c.address, c.tax_id, c.is_active,
        b.name as branch_name
      FROM customers c
      LEFT JOIN branches b ON c.branch_id = b.id
      WHERE c.is_active = true
    `;
        const values: any[] = [];

        if (filters.search) {
            query += ` AND (c.name ILIKE $1 OR c.email ILIKE $1 OR c.phone ILIKE $1)`;
            values.push(`%${filters.search}%`);
        }

        query += ` ORDER BY c.name ASC`;

        const result = await db.query(query, values);
        return result.rows;
    }

    /**
     * Find customer by ID
     */
    static async findById(db: Pool, id: string) {
        const query = `SELECT * FROM customers WHERE id = $1`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Create a new customer
     */
    static async create(db: Pool, customerData: any) {
        const { name, email, phone, address, tax_id, branch_id } = customerData;
        const query = `
      INSERT INTO customers (name, email, phone, address, tax_id, branch_id) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
        const values = [name, email || null, phone || null, address || null, tax_id || null, branch_id || null];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Soft delete customer
     */
    static async deactivate(db: Pool, id: string) {
        const query = `UPDATE customers SET is_active = false WHERE id = $1 RETURNING id, name`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}
