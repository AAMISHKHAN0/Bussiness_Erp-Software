import { Pool } from "pg";

type RoleRecord = {
    id: string;
    name: string | null;
    permissions?: unknown;
};

/**
 * Handle database queries for Authentication - Repository Layer
 */
export class AuthRepository {
    /**
     * Find a user by email, including their role info
     */
    static async findUserByEmail(db: Pool, email: string) {
        const query = `
      SELECT 
        u.id, u.email, u.password_hash, u.first_name, u.last_name, 
        u.is_active, u.role_id, u.branch_id,
        r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
    `;
        const result = await db.query(query, [email]);
        return result.rows[0];
    }

    /**
     * Find a user by ID
     */
    static async findUserById(db: Pool, id: string) {
        const query = `
      SELECT id, email, first_name, last_name, is_active, role_id, branch_id
      FROM users
      WHERE id = $1
    `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Get all permissions for a specific role
     */
    static async getRolePermissions(db: Pool, roleId: string) {
        try {
            const query = `
          SELECT p.name
          FROM permissions p
          JOIN role_permissions rp ON p.id = rp.permission_id
          WHERE rp.role_id = $1
        `;
            const result = await db.query(query, [roleId]);
            const mapped = result.rows.map((row: any) => row.name).filter(Boolean);
            if (mapped.length > 0) {
                return mapped;
            }
        } catch (error: any) {
            const message = String(error?.message || '').toLowerCase();
            if (!message.includes('relation') && !message.includes('column')) {
                throw error;
            }
        }

        const role = await this.getRoleById(db, roleId);
        return this.extractRolePermissions(role?.permissions);
    }

    static async getRoleById(db: Pool, roleId: string): Promise<RoleRecord | null> {
        try {
            const query = `SELECT id, name, permissions FROM roles WHERE id = $1`;
            const result = await db.query(query, [roleId]);
            return result.rows[0] || null;
        } catch (error: any) {
            const message = String(error?.message || '').toLowerCase();
            if (!message.includes('column')) {
                throw error;
            }

            const fallbackQuery = `SELECT id, name FROM roles WHERE id = $1`;
            const result = await db.query(fallbackQuery, [roleId]);
            return result.rows[0] || null;
        }
    }

    static async findSuperAdminRole(db: Pool): Promise<RoleRecord | null> {
        try {
            const query = `
          SELECT id, name, permissions
          FROM roles
          WHERE name = 'Super Admin'
          ORDER BY id
          LIMIT 1
        `;
            const result = await db.query(query);
            if (result.rows[0]) {
                return result.rows[0];
            }
        } catch (error: any) {
            const message = String(error?.message || '').toLowerCase();
            if (!message.includes('column')) {
                throw error;
            }
        }

        const fallbackQuery = `
      SELECT id, name
      FROM roles
      WHERE name = 'Super Admin'
      ORDER BY id
      LIMIT 1
    `;
        const fallbackResult = await db.query(fallbackQuery);
        return fallbackResult.rows[0] || null;
    }

    static async assignRoleToUser(db: Pool, userId: string, roleId: string) {
        const query = `UPDATE users SET role_id = $1 WHERE id = $2`;
        await db.query(query, [roleId, userId]);
    }

    static async resolveUserAccess(db: Pool, user: any) {
        let role = user?.role_id ? await this.getRoleById(db, user.role_id) : null;

        const isLegacyDefaultAdmin = typeof user?.email === 'string' && user.email.toLowerCase() === 'admin@company.com';
        if (!role && isLegacyDefaultAdmin) {
            role = await this.findSuperAdminRole(db);
            if (role?.id && user?.id) {
                await this.assignRoleToUser(db, user.id, role.id).catch(() => undefined);
            }
        }

        const roleName = role?.name || user?.role_name || null;
        let permissions: string[] = [];

        if (role?.id) {
            permissions = await this.getRolePermissions(db, role.id);
        }

        if (permissions.length === 0) {
            permissions = this.extractRolePermissions(role?.permissions);
        }

        if ((roleName === 'Super Admin' || permissions.includes('*')) && !permissions.includes('*')) {
            permissions = ['*', ...permissions];
        }

        return {
            roleId: role?.id || user?.role_id || null,
            roleName,
            permissions,
        };
    }

    private static extractRolePermissions(rawPermissions: unknown): string[] {
        if (Array.isArray(rawPermissions)) {
            return rawPermissions.filter((permission): permission is string => typeof permission === 'string');
        }

        if (typeof rawPermissions === 'string') {
            try {
                const parsed = JSON.parse(rawPermissions);
                if (Array.isArray(parsed)) {
                    return parsed.filter((permission): permission is string => typeof permission === 'string');
                }
            } catch {
                return [];
            }
        }

        return [];
    }

    /**
     * Create a new user
     */
    static async createUser(db: Pool, userData: any) {
        const { email, passwordHash, firstName, lastName, roleId, branchId, phone } = userData;
        const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role_id, branch_id, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, is_active, created_at
    `;
        const values = [email, passwordHash, firstName, lastName, roleId, branchId, phone];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Update user last login timestamp
     */
    static async updateLastLogin(db: Pool, userId: string) {
        const query = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`;
        await db.query(query, [userId]);
    }
}
