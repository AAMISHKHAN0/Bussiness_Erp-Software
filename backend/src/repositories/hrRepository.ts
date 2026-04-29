import { Pool } from "pg";

/**
 * Handle database queries for HR Management - Repository Layer
 */
export class HrRepository {
    /**
     * Get all employees
     */
    static async findAllEmployees(db: Pool) {
        const query = `SELECT * FROM employees ORDER BY created_at DESC`;
        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Get all attendance records
     */
    static async findAllAttendance(db: Pool) {
        const query = `SELECT * FROM attendance ORDER BY date DESC`;
        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Get all payroll records
     */
    static async findAllPayroll(db: Pool) {
        const query = `SELECT * FROM payroll ORDER BY month DESC`;
        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Create a new employee
     */
    static async createEmployee(db: Pool, employeeData: any) {
        const { first_name, last_name, email, designation, department, salary, join_date } = employeeData;
        const query = `
      INSERT INTO employees (first_name, last_name, email, designation, department, salary, join_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
        const values = [first_name, last_name, email || null, designation || null, department || null, salary || 0, join_date || new Date()];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Find employee by ID
     */
    static async findEmployeeById(db: Pool, id: string) {
        const query = `SELECT * FROM employees WHERE id = $1`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Soft delete / Deactivate employee
     */
    static async deactivateEmployee(db: Pool, id: string) {
        const query = `UPDATE employees SET is_active = false WHERE id = $1 RETURNING id, first_name, last_name`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}
