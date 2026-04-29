import { BranchRepository } from '../repositories/branchRepository';
import { ApiError } from '../utils/ApiError';
import { isValidEmail } from '../utils/validators';
import { Pool } from "pg";

export class BranchService {
    /**
     * Get all active branches
     */
    static async getActiveBranches(db: Pool) {
        return await BranchRepository.findAllActive(db);
    }

    /**
     * Create a new branch
     */
    static async createBranch(db: Pool, branchData: any) {
        const { name, email } = branchData;

        if (email && !isValidEmail(email)) {
            throw ApiError.badRequest('Invalid email format');
        }

        const newBranch = await BranchRepository.create(db, branchData);
        return newBranch;
    }

    /**
     * Get a branch by ID
     */
    static async getBranchById(db: Pool, id: string) {
        const branch = await BranchRepository.findById(db, id);
        if (!branch) {
            throw ApiError.notFound('Branch not found');
        }
        return branch;
    }
}
