import { ProductRepository } from '../repositories/productRepository';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { Pool } from "pg";

export class ProductService {
    /**
     * Get all products with filters
     */
    static async getAllProducts(db: Pool, filters: { category_id?: string; search?: string }) {
        return await ProductRepository.findAll(db, filters);
    }

    /**
     * Get product by ID
     */
    static async getProductById(db: Pool, id: string) {
        const product = await ProductRepository.findById(db, id);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }
        return product;
    }

    /**
     * Create product with initial stock (Atomic Transaction)
     */
    static async createProduct(db: Pool, productData: any, branchId: string | null) {
        let { sku, name, stock_quantity = 0 } = productData;

        // SKU Generation
        if (!sku || sku.trim() === '') {
            const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const prefix = name ? name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') : 'PRD';
            sku = `${prefix}-${Date.now().toString().slice(-4)}-${randomPart}`;
            productData.sku = sku;
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const newProduct = await ProductRepository.create(db, productData, client);

            // Fetch default branch if not provided
            if (!branchId || branchId === '') {
                const branchRes = await client.query('SELECT id FROM branches ORDER BY created_at ASC LIMIT 1');
                branchId = branchRes.rows[0]?.id || null;
            }

            if (Number(stock_quantity) > 0 && branchId) {
                await ProductRepository.initializeInventory(db, newProduct.id, branchId, Number(stock_quantity), client);
            }

            await client.query('COMMIT');
            return newProduct;
        } catch (error: any) {
            await client.query('ROLLBACK');
            if (error.code === '23505') {
                throw ApiError.conflict('Product with this SKU already exists');
            }
            logger.error('Failed to create product', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Update product and optional stock
     */
    static async updateProduct(db: Pool, id: string, productData: any, branchId: string | null) {
        const product = await ProductRepository.findById(db, id);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        const updated = await ProductRepository.update(db, id, productData);

        // Handle stock update if quantity is provided
        if (productData.stock_quantity !== undefined) {
            const qty = Number(productData.stock_quantity);
            
            // Find branch if not provided
            if (!branchId || branchId === '') {
                const branchRes = await db.query('SELECT id FROM branches ORDER BY created_at ASC LIMIT 1');
                branchId = branchRes.rows[0]?.id || '1';
            }

            if (branchId) {
                await ProductRepository.upsertInventory(db, id, branchId, qty);
            }
        }

        return updated;
    }

    /**
     * Soft delete product
     */
    static async deleteProduct(db: Pool, id: string) {
        const result = await ProductRepository.deactivate(db, id);
        if (!result) {
            throw ApiError.notFound('Product not found');
        }
        return result;
    }
}
