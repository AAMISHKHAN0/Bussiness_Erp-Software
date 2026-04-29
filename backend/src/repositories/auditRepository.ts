import { Pool } from "pg";

/**
 * Handle database queries for System Audit Logs - Repository Layer
 */
export class AuditRepository {
    /**
     * Get recent audit logs with user info
     */
    static async findRecent(db: Pool, limit: number = 50) {
        const query = `
      SELECT al.*, u.first_name, u.last_name, u.email as user_email 
      FROM audit_logs al 
      LEFT JOIN users u ON al.user_id = u.id 
      ORDER BY al.created_at DESC 
      LIMIT $1
    `;
        const result = await db.query(query, [limit]);
        return result.rows;
    }

    /**
     * Create a new audit log entry
     */
    static async create(db: Pool, logData: { user_id: string; action: string; resource: string; resource_id?: string; details?: any; ip_address?: string }) {
        const { user_id, action, resource, resource_id, details, ip_address } = logData;
        const query = `
      INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
        const values = [user_id, action, resource, resource_id || null, details || null, ip_address || null];
        const result = await db.query(query, values);
        return result.rows[0];
    }
}
