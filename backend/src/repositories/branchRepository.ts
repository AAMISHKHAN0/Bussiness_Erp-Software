import { Pool } from "pg";

/**
 * Handle database queries for Branch Management - Repository Layer
 */
export class BranchRepository {
    /**
     * Get all active branches
     */
    static async findAllActive(db: Pool) {
        const query = `
      SELECT id, name, address, phone, email, is_active 
      FROM branches 
      WHERE is_active = true
      ORDER BY name ASC
    `;
        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Find a branch by ID
     */
    static async findById(db: Pool, id: string) {
        const query = `SELECT * FROM branches WHERE id = $1`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Create a new branch
     */
    static async create(db: Pool, branchData: any) {
        const { name, address, phone, email } = branchData;
        const query = `
      INSERT INTO branches (name, address, phone, email) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, address, phone, email, is_active
    `;
        const values = [name, address, phone, email];
        const result = await db.query(query, values);
        return result.rows[0];
    }
}
