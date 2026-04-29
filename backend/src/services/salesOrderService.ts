import { SalesOrderRepository } from '../repositories/salesOrderRepository';
import { InventoryRepository } from '../repositories/inventoryRepository';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { Pool } from "pg";

export interface SalesOrderLineInput {
    product_id: string;
    quantity: unknown;
    unit_price: unknown;
}

export interface CreateSalesOrderInput {
    customer_id: string;
    branch_id: string;
    items: SalesOrderLineInput[];
    status?: string;
    notes?: string;
}

interface ProcessedLine {
    product_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

const PG_UNIQUE_VIOLATION = '23505';
const MAX_ORDER_NUMBER_ATTEMPTS = 8;

export class SalesOrderService {
    /**
     * Get all sales orders
     */
    static async getAllOrders(db: Pool) {
        return await SalesOrderRepository.findAll(db);
    }

    /**
     * Get order by ID with details
     */
    static async getOrderById(db: Pool, id: string) {
        const order = await SalesOrderRepository.findById(db, id);
        if (!order) {
            throw ApiError.notFound('Sales order not found');
        }
        order.items = await SalesOrderRepository.findItemsByOrderId(db, id);
        return order;
    }

    /**
     * Create a new sales order (Atomic Transaction)
     */
    static async createOrder(db: Pool, orderData: CreateSalesOrderInput, userId: string) {
        const { customer_id, branch_id, items, status, notes } = orderData;

        if (!Array.isArray(items) || items.length === 0) {
            throw ApiError.badRequest('Order must contain at least one item');
        }

        const processedItems: ProcessedLine[] = [];
        for (const item of items) {
            if (!item?.product_id || String(item.product_id).trim() === '') {
                throw ApiError.badRequest('Each item must have a valid product_id');
            }
            const qty = parseFloat(String(item.quantity));
            const price = parseFloat(String(item.unit_price));
            if (Number.isNaN(qty) || qty <= 0) {
                throw ApiError.badRequest('Each item must have a positive quantity');
            }
            if (Number.isNaN(price) || price < 0) {
                throw ApiError.badRequest('Each item must have a non-negative unit_price');
            }
            const subtotal = qty * price;
            processedItems.push({
                product_id: String(item.product_id),
                quantity: qty,
                unit_price: price,
                subtotal,
            });
        }

        const needByProduct = new Map<string, number>();
        for (const item of processedItems) {
            needByProduct.set(item.product_id, (needByProduct.get(item.product_id) ?? 0) + item.quantity);
        }

        const totalAmount = processedItems.reduce((sum, i) => sum + i.subtotal, 0);

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            for (const [productId, needQty] of needByProduct) {
                const current = await InventoryRepository.getStockLevel(db, productId, branch_id, client);
                if (current < needQty) {
                    throw ApiError.badRequest(
                        `Insufficient stock at this branch. Product ${productId}: current ${current}, required ${needQty}`
                    );
                }
            }

            let newOrder: Awaited<ReturnType<typeof SalesOrderRepository.createHeader>> | null = null;
            let lastOrderErr: unknown;

            for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt++) {
                const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const orderNumber =
                    attempt === 0
                        ? `SO-${datePrefix}-${randomSuffix}`
                        : `SO-${datePrefix}-${randomSuffix}-${attempt}`;

                try {
                    newOrder = await SalesOrderRepository.createHeader(
                        db, {
                            order_number: orderNumber,
                            customer_id,
                            branch_id,
                            status: status || 'draft',
                            total_amount: totalAmount,
                            notes,
                            created_by: userId,
                        },
                        client
                    );
                    lastOrderErr = undefined;
                    break;
                } catch (e: unknown) {
                    lastOrderErr = e;
                    const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: unknown }).code) : '';
                    if (code === PG_UNIQUE_VIOLATION) {
                        continue;
                    }
                    throw e;
                }
            }

            if (!newOrder) {
                throw lastOrderErr instanceof Error
                    ? lastOrderErr
                    : ApiError.internal('Could not allocate a unique order number');
            }

            for (const item of processedItems) {
                await InventoryRepository.updateStock(db, item.product_id, branch_id, -item.quantity, client);

                await SalesOrderRepository.createItem(
                    db, {
                        sales_order_id: newOrder.id,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        subtotal: item.subtotal,
                    },
                    client
                );
            }

            await SalesOrderRepository.recordTransaction(
                db, {
                    date: new Date().toISOString(),
                    description: `Sales Order ${newOrder.order_number}`,
                    amount: totalAmount,
                    debit_account: 'Accounts Receivable',
                    credit_account: 'Sales Revenue',
                },
                client
            );

            await client.query('COMMIT');
            return newOrder;
        } catch (error: unknown) {
            await client.query('ROLLBACK');
            const message = error instanceof Error ? error.message : String(error);
            logger.error('Failed to create sales order', { error: message });
            throw error;
        } finally {
            client.release();
        }
    }
}
