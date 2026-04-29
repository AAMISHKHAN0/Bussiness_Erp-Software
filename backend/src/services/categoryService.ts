import { CategoryRepository } from '../repositories/categoryRepository';
import { ApiError } from '../utils/ApiError';
import { Pool } from "pg";

export class CategoryService {
    /**
     * Get all active categories
     */
    static async getActiveCategories(db: Pool) {
        return await CategoryRepository.findAllActive(db);
    }

    /**
     * Create a category
     */
    static async createCategory(db: Pool, data: any) {
        if (data.parent_id) {
            const parent = await CategoryRepository.findById(db, data.parent_id);
            if (!parent) {
                throw ApiError.badRequest('Parent category does not exist');
            }
        }
        return await CategoryRepository.create(db, data);
    }

    /**
     * Update a category
     */
    static async updateCategory(db: Pool, id: string, data: any) {
        if (data.parent_id) {
            if (data.parent_id === id) {
                throw ApiError.badRequest('A category cannot be its own parent');
            }
            const parent = await CategoryRepository.findById(db, data.parent_id);
            if (!parent) {
                throw ApiError.badRequest('Parent category does not exist');
            }
        }

        const category = await CategoryRepository.findById(db, id);
        if (!category) {
            throw ApiError.notFound('Category not found');
        }

        return await CategoryRepository.update(db, id, data);
    }

    /**
     * Delete a category
     */
    static async deleteCategory(db: Pool, id: string) {
        const category = await CategoryRepository.findById(db, id);
        if (!category) {
            throw ApiError.notFound('Category not found');
        }

        if (await CategoryRepository.hasProducts(db, id)) {
            throw ApiError.badRequest('Cannot delete category: It is currently used by one or more products');
        }

        if (await CategoryRepository.hasChildren(db, id)) {
            throw ApiError.badRequest('Cannot delete category: It has child categories');
        }

        return await CategoryRepository.delete(db, id);
    }
}
