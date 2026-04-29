import { Pool } from 'pg';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

function computePoTotal(body: {
    items: Array<{ quantity: number; unit_price: number }>;
    tax_amount?: number;
    shipping_amount?: number;
}) {
    const subtotal = (body.items || []).reduce(
        (s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0),
        0
    );
    const tax = Number(body.tax_amount) || 0;
    const ship = Number(body.shipping_amount) || 0;
    return subtotal + tax + ship;
}

export class PurchaseOrderService {
    static async list(db: Pool) {
        const r = await db.query(
            `SELECT * FROM purchase_orders ORDER BY created_at DESC NULLS LAST, id DESC`
        );
        return r.rows;
    }

    static async getById(db: Pool, id: string) {
        const hdr = await db.query(`SELECT * FROM purchase_orders WHERE id = $1`, [id]);
        const row = hdr.rows[0];
        if (!row) throw ApiError.notFound('Purchase order not found');

        const itemsRes = await db.query(
            `SELECT * FROM purchase_order_items WHERE purchase_order_id = $1 ORDER BY id ASC`,
            [id]
        );

        return {
            ...row,
            expected_delivery_date: row.expected_date ?? row.expected_delivery_date,
            items: itemsRes.rows,
        };
    }

    static async create(db: Pool, body: any, userId: string) {
        const {
            supplier_id,
            branch_id,
            tax_amount = 0,
            shipping_amount = 0,
            expected_delivery_date,
            items,
            notes,
        } = body;

        if (!supplier_id || !branch_id) {
            throw ApiError.badRequest('supplier_id and branch_id are required');
        }
        if (!Array.isArray(items) || items.length === 0) {
            throw ApiError.badRequest('At least one line item is required');
        }

        const total_amount = computePoTotal(body);
        const orderNumber = `PO-${Date.now()}`;
        const expectedDate = expected_delivery_date || null;

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const ins = await client.query(
                `INSERT INTO purchase_orders (
          supplier_id, branch_id, user_id, order_number, status, total_amount, expected_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
                [supplier_id, branch_id, userId, orderNumber, 'Draft', total_amount, expectedDate]
            );

            const po = ins.rows[0];
            const poId = po.id;

            for (const line of items) {
                const qty = Number(line.quantity) || 0;
                const price = Number(line.unit_price) || 0;
                const lineTotal = qty * price;
                await client.query(
                    `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, total)
           VALUES ($1, $2, $3, $4, $5)`,
                    [poId, line.product_id, qty, price, lineTotal]
                );
            }

            await client.query('COMMIT');

            return {
                ...po,
                notes: notes ?? null,
                tax_amount,
                shipping_amount,
                expected_delivery_date: expectedDate,
                items,
            };
        } catch (err: any) {
            await client.query('ROLLBACK');
            logger.error('Failed to create purchase order', { error: err.message });
            throw err;
        } finally {
            client.release();
        }
    }

    static async update(db: Pool, id: string, body: any, userId: string) {
        await this.getById(db, id);

        const {
            supplier_id,
            branch_id,
            tax_amount = 0,
            shipping_amount = 0,
            expected_delivery_date,
            items,
            notes,
        } = body;

        if (!Array.isArray(items) || items.length === 0) {
            throw ApiError.badRequest('At least one line item is required');
        }

        const total_amount = computePoTotal(body);
        const expectedDate = expected_delivery_date || null;

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `UPDATE purchase_orders SET
          supplier_id = COALESCE($2, supplier_id),
          branch_id = COALESCE($3, branch_id),
          user_id = $4,
          total_amount = $5,
          expected_date = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
                [id, supplier_id || null, branch_id || null, userId, total_amount, expectedDate]
            );

            await client.query(`DELETE FROM purchase_order_items WHERE purchase_order_id = $1`, [id]);

            for (const line of items) {
                const qty = Number(line.quantity) || 0;
                const price = Number(line.unit_price) || 0;
                const lineTotal = qty * price;
                await client.query(
                    `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, total)
           VALUES ($1, $2, $3, $4, $5)`,
                    [id, line.product_id, qty, price, lineTotal]
                );
            }

            await client.query('COMMIT');

            return this.getById(db, id);
        } catch (err: any) {
            await client.query('ROLLBACK');
            logger.error('Failed to update purchase order', { error: err.message });
            throw err;
        } finally {
            client.release();
        }
    }

    static async delete(db: Pool, id: string) {
        await this.getById(db, id);
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            await client.query(`DELETE FROM purchase_order_items WHERE purchase_order_id = $1`, [id]);
            await client.query(`DELETE FROM purchase_orders WHERE id = $1`, [id]);
            await client.query('COMMIT');
        } catch (err: any) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}
