import { UserRepository } from '../repositories/userRepository';
import { ApiError } from '../utils/ApiError';
import { Pool } from "pg";

export class UserService {
    /**
     * Get all users
     */
    static async getAllUsers(db: Pool) {
        return await UserRepository.findAll(db);
    }

    /**
     * Get a user by ID
     */
    static async getUserById(db: Pool, id: string) {
        const user = await UserRepository.findById(db, id);
        if (!user) {
            throw ApiError.notFound('User not found');
        }
        return user;
    }

    /**
     * Deactivate a user
     */
    static async deactivateUser(db: Pool, id: string) {
        const user = await UserRepository.findById(db, id);
        if (!user) {
            throw ApiError.notFound('User not found');
        }
        return await UserRepository.deactivate(db, id);
    }

    /**
     * Reactivate a user
     */
    static async reactivateUser(db: Pool, id: string) {
        const user = await UserRepository.findById(db, id);
        if (!user) {
            throw ApiError.notFound('User not found');
        }
        return await UserRepository.reactivate(db, id);
    }
}
