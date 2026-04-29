import { SupplierRepository } from '../repositories/supplierRepository';
import { ApiError } from '../utils/ApiError';
import { isValidEmail } from '../utils/validators';
import { Pool } from "pg";

export class SupplierService {
    /**
     * Get all active suppliers with optional search
     */
    static async getSuppliers(db: Pool, filters: { search?: string }) {
        return await SupplierRepository.findAll(db, filters);
    }

    /**
     * Get supplier by ID
     */
    static async getSupplierById(db: Pool, id: string) {
        const supplier = await SupplierRepository.findById(db, id);
        if (!supplier) {
            throw ApiError.notFound('Supplier not found');
        }
        return supplier;
    }

    /**
     * Create a new supplier
     */
    static async createSupplier(db: Pool, supplierData: any) {
        const { email } = supplierData;

        if (email && !isValidEmail(email)) {
            throw ApiError.badRequest('Invalid email format');
        }

        try {
            return await SupplierRepository.create(db, supplierData);
        } catch (error: any) {
            if (error.code === '23505') {
                throw ApiError.conflict('Supplier with this email or tax ID already exists');
            }
            throw error;
        }
    }

    /**
     * Soft delete supplier
     */
    static async deleteSupplier(db: Pool, id: string) {
        const result = await SupplierRepository.deactivate(db, id);
        if (!result) {
            throw ApiError.notFound('Supplier not found');
        }
        return result;
    }
}
