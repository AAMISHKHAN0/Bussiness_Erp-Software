import { Pool } from "pg";

/**
 * Handle database queries for User Management - Repository Layer
 */
export class UserRepository {
    /**
     * Get all users with roles and branch info
     */
    static async findAll(db: Pool) {
        const query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.last_login,
        r.name as role_name,
        b.name as branch_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.branch_id = b.id
      ORDER BY u.created_at DESC
    `;
        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Find a user by ID with full details
     */
    static async findById(db: Pool, id: string) {
        const query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.created_at,
        r.id as role_id, r.name as role_name,
        b.id as branch_id, b.name as branch_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.id = $1
    `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Soft delete / Deactivate a user
     */
    static async deactivate(db: Pool, id: string) {
        const query = `UPDATE users SET is_active = false WHERE id = $1 RETURNING id`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Reactivate a user
     */
    static async reactivate(db: Pool, id: string) {
        const query = `UPDATE users SET is_active = true WHERE id = $1 RETURNING id`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}
