import { Pool } from "pg";

/**
 * Handle database queries for Supplier Management - Repository Layer
 */
export class SupplierRepository {
    /**
     * Get all active suppliers with optional search
     */
    static async findAll(db: Pool, filters: { search?: string }) {
        let query = `
      SELECT 
        s.id, s.name, s.company_name, s.contact_person, s.email, s.phone, s.address, s.tax_id, s.is_active,
        b.name as branch_name
      FROM suppliers s
      LEFT JOIN branches b ON s.branch_id = b.id
      WHERE s.is_active = true
    `;
        const values: any[] = [];

        if (filters.search) {
            query += ` AND (s.name ILIKE $1 OR s.email ILIKE $1 OR s.contact_person ILIKE $1)`;
            values.push(`%${filters.search}%`);
        }

        query += ` ORDER BY s.name ASC`;

        const result = await db.query(query, values);
        return result.rows;
    }

    /**
     * Find supplier by ID
     */
    static async findById(db: Pool, id: string) {
        const query = `SELECT * FROM suppliers WHERE id = $1`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Create a new supplier
     */
    static async create(db: Pool, supplierData: any) {
        const { 
            name, company_name, contact_person, email, phone, 
            address, city, country, tax_id, payment_terms, notes, branch_id 
        } = supplierData;

        const query = `
      INSERT INTO suppliers 
        (name, company_name, contact_person, email, phone, address, city, country, tax_id, payment_terms, notes, branch_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *
    `;
        const values = [
            name, company_name || null, contact_person || null, email || null, phone || null, 
            address || null, city || null, country || null, tax_id || null, 
            payment_terms || null, notes || null, branch_id || null
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Soft delete supplier
     */
    static async deactivate(db: Pool, id: string) {
        const query = `UPDATE suppliers SET is_active = false WHERE id = $1 RETURNING id, name`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
}
