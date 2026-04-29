import { Pool } from 'pg';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

function computeInvoiceTotal(body: {
    items: Array<{ quantity: number; unit_price: number }>;
    tax_amount?: number;
    discount_amount?: number;
    shipping_amount?: number;
}) {
    const subtotal = (body.items || []).reduce(
        (s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0),
        0
    );
    const tax = Number(body.tax_amount) || 0;
    const discount = Number(body.discount_amount) || 0;
    const ship = Number(body.shipping_amount) || 0;
    return subtotal + tax + ship - discount;
}

export class InvoiceService {
    static async list(db: Pool) {
        const r = await db.query(
            `SELECT * FROM invoices ORDER BY created_at DESC NULLS LAST, id DESC`
        );
        const cr = await db.query(`SELECT id, name FROM customers`);
        const custMap = new Map(cr.rows.map((c: any) => [String(c.id), c.name as string]));
        const soRes = await db.query(`SELECT id, customer_id FROM sales_orders`);
        const soCustomer = new Map(
            soRes.rows.map((row: any) => [String(row.id), row.customer_id != null ? String(row.customer_id) : null])
        );

        return r.rows.map((inv: any) => {
            let customerId: string | null = null;
            if (inv.reference_type === 'Customer' || inv.reference_type === 'Direct') {
                customerId = String(inv.reference_id);
            } else if (inv.reference_type === 'SalesOrder') {
                const cid = soCustomer.get(String(inv.reference_id));
                customerId = cid ?? null;
            }

            const customer_name =
                customerId != null ? custMap.get(customerId) ?? '—' : '—';

            const amt = Number(inv.amount);
            return {
                ...inv,
                customer_id: customerId,
                customer_name,
                grand_total: amt,
                total_amount: amt,
                status: inv.status || 'Unpaid',
            };
        });
    }

    static async create(db: Pool, body: any) {
        const {
            customer_id,
            sales_order_id,
            tax_amount = 0,
            discount_amount = 0,
            shipping_amount = 0,
            items,
            notes,
        } = body;

        if (!customer_id) {
            throw ApiError.badRequest('customer_id is required');
        }
        if (!Array.isArray(items) || items.length === 0) {
            throw ApiError.badRequest('At least one line item is required');
        }

        const amount = computeInvoiceTotal(body);
        const invoice_number = `INV-${Date.now()}`;
        const reference_type = sales_order_id ? 'SalesOrder' : 'Customer';
        const reference_id = sales_order_id || customer_id;

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const ins = await client.query(
                `INSERT INTO invoices (reference_type, reference_id, invoice_number, amount, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [reference_type, reference_id, invoice_number, amount, 'Unpaid']
            );

            const inv = ins.rows[0];

            await client.query('COMMIT');

            return {
                ...inv,
                customer_id,
                sales_order_id: sales_order_id || null,
                total_amount: amount,
                grand_total: amount,
                customer_name: null,
                notes: notes ?? null,
                tax_amount,
                discount_amount,
                shipping_amount,
                items,
            };
        } catch (err: any) {
            await client.query('ROLLBACK');
            logger.error('Failed to create invoice', { error: err.message });
            throw err;
        } finally {
            client.release();
        }
    }

    static async deleteById(db: Pool, id: string) {
        await db.query(`DELETE FROM invoices WHERE id = $1`, [id]);
    }
}
