import { CustomerRepository } from '../repositories/customerRepository';
import { ApiError } from '../utils/ApiError';
import { isValidEmail } from '../utils/validators';
import { Pool } from "pg";

export class CustomerService {
    /**
     * Get all active customers with optional search
     */
    static async getCustomers(db: Pool, filters: { search?: string }) {
        return await CustomerRepository.findAll(db, filters);
    }

    /**
     * Get customer by ID
     */
    static async getCustomerById(db: Pool, id: string) {
        const customer = await CustomerRepository.findById(db, id);
        if (!customer) {
            throw ApiError.notFound('Customer not found');
        }
        return customer;
    }

    /**
     * Create a new customer
     */
    static async createCustomer(db: Pool, customerData: any) {
        const { email } = customerData;

        if (email && !isValidEmail(email)) {
            throw ApiError.badRequest('Invalid email format');
        }

        try {
            return await CustomerRepository.create(db, customerData);
        } catch (error: any) {
            if (error.code === '23505') {
                throw ApiError.conflict('Customer with this email or tax ID already exists');
            }
            throw error;
        }
    }

    /**
     * Soft delete customer
     */
    static async deleteCustomer(db: Pool, id: string) {
        const result = await CustomerRepository.deactivate(db, id);
        if (!result) {
            throw ApiError.notFound('Customer not found');
        }
        return result;
    }
}
