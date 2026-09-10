import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requirePermission, getClientIp } from '@/lib/auth';
import AccountingEngine from '@/lib/accountingEngine';
import { InventoryService } from '@/lib/inventoryService';

export async function GET(request) {
  try {
    const authCheck = await requirePermission(request, 'pos:view');
    if (!authCheck.authorized) return authCheck.response;

    const { tenant_id, user } = authCheck.auth;
    const products = db.get('products', tenant_id);
    const customers = db.get('customers', tenant_id);
    const registers = db.get('pos_registers', tenant_id);
    const sessions = db.get('pos_sessions', tenant_id);
    const heldSales = db.get('pos_held_sales', tenant_id);
    const sales = db.get('pos_sales', tenant_id);
    const settings = db.getSettings(tenant_id);

    // Filter categories
    const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

    // Find active session for user or default register
    const activeSession = sessions.find(s => s.status === 'Open' && (s.cashier_id === user.id || s.register_id === 'reg-1')) || sessions[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode || p.sku,
          category: p.category,
          selling_price: Number(p.selling_price) || 0,
          purchase_price: Number(p.purchase_price) || 0,
          quantity: Number(p.quantity) || 0,
          min_stock_level: Number(p.min_stock_level) || 0,
          status: p.status
        })),
        categories,
        customers: customers.map(c => ({
          id: c.id,
          name: c.name || c.company_name,
          phone: c.phone || '',
          email: c.email || '',
          current_balance: Number(c.current_balance) || 0,
          total_spent: Number(c.total_spent) || 0
        })),
        registers,
        activeSession,
        heldSales,
        recentSales: sales.slice(-20).reverse(),
        settings
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;
    const clientIp = getClientIp(request);

    // ==========================================
    // ACTION 1: COMPLETE POS SALE (TRANSACTIONAL)
    // ==========================================
    if (!action || action === 'complete-sale') {
      const authCheck = await requirePermission(request, 'pos:create_sale');
      if (!authCheck.authorized) return authCheck.response;

      const { user, tenant_id } = authCheck.auth;
      const { 
        customer_id = 'cust-walkin',
        items = [],
        subtotal = 0,
        discount_amount = 0,
        tax_amount = 0,
        total_amount = 0,
        payment_method = 'Cash',
        amount_tendered = 0,
        change_amount = 0,
        register_id = 'reg-1',
        session_id = 'sess-1',
        held_id = null,
        notes = ''
      } = body;

      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, message: 'At least one item is required to complete sale.' }, { status: 400 });
      }

      // 1. Stock verification & reserve check
      for (const item of items) {
        const product = db.findById('products', item.product_id, tenant_id);
        if (!product) {
          return NextResponse.json({ success: false, message: `Product ${item.name || item.product_id} not found.` }, { status: 404 });
        }
        const availableQty = Number(product.quantity) || 0;
        const requestedQty = Number(item.quantity) || 1;
        if (availableQty < requestedQty) {
          return NextResponse.json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${availableQty}, requested: ${requestedQty}.`
          }, { status: 400 });
        }
      }

      // 2. Fetch customer
      const customer = db.findById('customers', customer_id, tenant_id) || {
        id: 'cust-walkin',
        name: 'Walk-in Retail Customer',
        phone: 'N/A'
      };

      const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      // 3. Atomically Deduct Inventory & Create Stock Movement Records
      const processedItems = [];
      for (const item of items) {
        const qty = Number(item.quantity) || 1;
        const unitPrice = Number(item.unit_price) || 0;
        const lineTotal = qty * unitPrice;

        processedItems.push({
          product_id: item.product_id,
          name: item.name,
          sku: item.sku,
          quantity: qty,
          unit_price: unitPrice,
          total: lineTotal
        });

        InventoryService.recordMovement({
          productId: item.product_id,
          movementType: 'SALES_DISPATCH',
          quantityChange: -qty,
          warehouseId: 'wh-1',
          referenceId: receiptNumber,
          user,
          notes: `POS Retail Counter Checkout - Receipt #${receiptNumber}`,
          tenantId: tenant_id
        });
      }

      // 4. Create POS Sale Record
      const saleRecord = db.insert('pos_sales', {
        receipt_number: receiptNumber,
        session_id,
        register_id,
        customer_id: customer.id,
        customer_name: customer.name || customer.company_name,
        customer_phone: customer.phone || '',
        items: processedItems,
        subtotal: Number(subtotal),
        discount_amount: Number(discount_amount),
        tax_amount: Number(tax_amount),
        total_amount: Number(total_amount),
        payment_method,
        amount_tendered: Number(amount_tendered),
        change_amount: Number(change_amount),
        cashier_id: user.id,
        cashier_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        branch_id: user.branch_id || 'b-1',
        sale_date: new Date().toISOString(),
        status: 'Completed',
        notes
      }, tenant_id);

      // 5. Automatically Create & Synchronize Official Commercial Invoice
      const invoiceNumber = `INV-${receiptNumber.replace('REC-', 'POS-')}`;
      const newInvoice = db.insert('invoices', {
        invoice_number: invoiceNumber,
        receipt_number: receiptNumber,
        order_number: receiptNumber,
        sale_id: saleRecord.id,
        customer_id: customer.id,
        customer_name: customer.name || customer.company_name,
        customer_email: customer.email || '',
        customer_phone: customer.phone || '',
        invoice_date: new Date().toISOString().slice(0, 10),
        due_date: new Date().toISOString().slice(0, 10),
        items: processedItems,
        subtotal: Number(subtotal),
        discount_amount: Number(discount_amount),
        tax_amount: Number(tax_amount),
        total_amount: Number(total_amount),
        amount_paid: Number(total_amount),
        balance_due: 0,
        status: 'Paid',
        payment_status: 'Paid',
        payment_method,
        terms: 'Settled immediately at POS Counter',
        notes: notes || `POS Retail Sale - Receipt #${receiptNumber}`,
        created_by: saleRecord.cashier_name,
        source: 'POS'
      }, tenant_id);

      // 6. Record formal payment linked to both sale and invoice
      db.insert('payments', {
        payment_number: `PAY-${receiptNumber}`,
        invoice_id: newInvoice.id,
        invoice_number: invoiceNumber,
        sale_id: saleRecord.id,
        customer_id: customer.id,
        customer_name: customer.name,
        amount: Number(total_amount),
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method,
        reference: receiptNumber,
        status: 'Cleared'
      }, tenant_id);

      db.persist('invoices');

      // 6. Update Customer History
      if (customer.id !== 'cust-walkin') {
        db.update('customers', customer.id, {
          total_spent: Math.round(((Number(customer.total_spent) || 0) + Number(total_amount)) * 100) / 100
        }, tenant_id);
      }

      // 7. Update Register Drawer Cash Balance if Cash
      if (payment_method.toLowerCase().includes('cash')) {
        const register = db.findById('pos_registers', register_id, tenant_id);
        if (register) {
          db.update('pos_registers', register.id, {
            current_balance: Math.round(((Number(register.current_balance) || 0) + Number(total_amount)) * 100) / 100
          }, tenant_id);
        }
      }

      // 8. Automated GAAP Double-Entry Posting
      let journalVoucher = null;
      try {
        journalVoucher = AccountingEngine.postPOSSale(saleRecord, user, tenant_id);
      } catch (accErr) {
        console.warn('[POS API] Accounting posting notice:', accErr.message);
      }

      // 9. If resuming a held sale, remove it from held_sales
      if (held_id) {
        db.delete('pos_held_sales', held_id, tenant_id);
      }

      // 10. Audit Log
      db.logAudit(
        'POS_SALE_COMPLETED',
        'Point of Sale',
        `Completed retail sale ${receiptNumber} for ${customer.name} (PKR ${total_amount.toLocaleString()}) via ${payment_method}`,
        user,
        clientIp
      );

      return NextResponse.json({
        success: true,
        message: `Sale completed successfully. Receipt #${receiptNumber}`,
        data: {
          sale: saleRecord,
          voucher: journalVoucher
        }
      });
    }

    // ==========================================
    // ACTION 2: HOLD CURRENT SALE
    // ==========================================
    if (action === 'hold-sale') {
      const authCheck = await requirePermission(request, 'pos:create_sale');
      if (!authCheck.authorized) return authCheck.response;

      const { user, tenant_id } = authCheck.auth;
      const { items, customer_id, customer_name, subtotal, total_amount, reference_note } = body;

      if (!items || items.length === 0) {
        return NextResponse.json({ success: false, message: 'Cart is empty. Cannot hold sale.' }, { status: 400 });
      }

      const heldRecord = db.insert('pos_held_sales', {
        reference_note: reference_note || `Held Cart (${items.length} items)`,
        customer_id: customer_id || 'cust-walkin',
        customer_name: customer_name || 'Walk-in Customer',
        items,
        subtotal: Number(subtotal) || 0,
        total_amount: Number(total_amount) || 0,
        cashier_id: user.id,
        cashier_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        held_at: new Date().toISOString()
      }, tenant_id);

      db.logAudit('POS_SALE_HELD', 'POS', `Held sale cart with ${items.length} items`, user, clientIp);

      return NextResponse.json({
        success: true,
        message: 'Sale suspended and held in queue.',
        data: heldRecord
      });
    }

    // ==========================================
    // ACTION 3: RESUME / REMOVE HELD SALE
    // ==========================================
    if (action === 'resume-sale') {
      const authCheck = await requirePermission(request, 'pos:create_sale');
      if (!authCheck.authorized) return authCheck.response;

      const { tenant_id } = authCheck.auth;
      const { held_id } = body;

      const heldSale = db.findById('pos_held_sales', held_id, tenant_id);
      if (!heldSale) {
        return NextResponse.json({ success: false, message: 'Held sale not found.' }, { status: 404 });
      }

      db.delete('pos_held_sales', held_id, tenant_id);
      return NextResponse.json({
        success: true,
        message: 'Held sale restored to checkout counter.',
        data: heldSale
      });
    }

    // ==========================================
    // ACTION 4: REFUND / RETURN POS SALE
    // ==========================================
    if (action === 'refund') {
      const authCheck = await requirePermission(request, 'pos:refund');
      if (!authCheck.authorized) return authCheck.response;

      const { user, tenant_id } = authCheck.auth;
      const { sale_id, reason = 'Customer Return' } = body;

      const sale = db.findById('pos_sales', sale_id, tenant_id);
      if (!sale) {
        return NextResponse.json({ success: false, message: 'POS Sale record not found.' }, { status: 404 });
      }

      if (sale.status === 'Refunded') {
        return NextResponse.json({ success: false, message: 'This sale has already been refunded.' }, { status: 400 });
      }

      // Restock items
      if (Array.isArray(sale.items)) {
        for (const item of sale.items) {
          InventoryService.recordMovement({
            productId: item.product_id,
            movementType: 'SALES_RETURN',
            quantityChange: Number(item.quantity) || 1,
            warehouseId: 'wh-1',
            referenceId: `REFUND-${sale.receipt_number}`,
            user,
            notes: `POS Return/Refund for Receipt #${sale.receipt_number}: ${reason}`,
            tenantId: tenant_id
          });
        }
      }

      // Adjust register cash if was cash
      if (sale.payment_method?.toLowerCase().includes('cash')) {
        const register = db.findById('pos_registers', sale.register_id || 'reg-1', tenant_id);
        if (register) {
          db.update('pos_registers', register.id, {
            current_balance: Math.max(0, (Number(register.current_balance) || 0) - Number(sale.total_amount))
          }, tenant_id);
        }
      }

      // Update sale status
      db.update('pos_sales', sale.id, {
        status: 'Refunded',
        refund_date: new Date().toISOString(),
        refund_reason: reason,
        refunded_by: user.email
      }, tenant_id);

      // Also update linked commercial invoice to Void
      const allInvoices = db.get('invoices', tenant_id);
      const linkedInv = allInvoices.find(i => i.sale_id === sale.id || i.receipt_number === sale.receipt_number);
      if (linkedInv) {
        db.update('invoices', linkedInv.id, {
          status: 'Void',
          notes: `${linkedInv.notes || ''} [Refunded & Voided on ${new Date().toISOString().slice(0, 10)}: ${reason}]`
        }, tenant_id);
        db.persist('invoices');
      }

      // GAAP Accounting Reversal
      try {
        AccountingEngine.reverseTransaction(sale.receipt_number, reason, user, tenant_id);
      } catch (revErr) {
        console.warn('[POS API] Refund reversal notice:', revErr.message);
      }

      db.logAudit('POS_SALE_REFUNDED', 'POS', `Processed return & refund for ${sale.receipt_number} (PKR ${sale.total_amount})`, user, clientIp);

      return NextResponse.json({
        success: true,
        message: `Sale ${sale.receipt_number} successfully refunded and stock replenished.`
      });
    }

    // ==========================================
    // ACTION 5: OPEN / CLOSE REGISTER SESSION
    // ==========================================
    if (action === 'open-session') {
      const authCheck = await requirePermission(request, 'pos:create_sale');
      if (!authCheck.authorized) return authCheck.response;

      const { user, tenant_id } = authCheck.auth;
      const { register_id = 'reg-1', opening_cash = 10000 } = body;

      const session = db.insert('pos_sessions', {
        register_id,
        cashier_id: user.id,
        cashier_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        start_time: new Date().toISOString(),
        opening_cash: Number(opening_cash),
        closing_cash: null,
        status: 'Open'
      }, tenant_id);

      db.update('pos_registers', register_id, { status: 'Active', current_balance: Number(opening_cash) }, tenant_id);
      db.logAudit('POS_SESSION_OPENED', 'POS', `Opened POS cashier session for Register #${register_id}`, user, clientIp);

      return NextResponse.json({ success: true, message: 'POS session opened.', data: session });
    }

    if (action === 'close-session') {
      const authCheck = await requirePermission(request, 'pos:close_register');
      if (!authCheck.authorized) return authCheck.response;

      const { user, tenant_id } = authCheck.auth;
      const { session_id, closing_cash = 0 } = body;

      const session = db.findById('pos_sessions', session_id, tenant_id);
      if (session) {
        db.update('pos_sessions', session.id, {
          closing_cash: Number(closing_cash),
          end_time: new Date().toISOString(),
          status: 'Closed'
        }, tenant_id);
      }

      db.logAudit('POS_SESSION_CLOSED', 'POS', `Closed POS cashier session #${session_id}`, user, clientIp);
      return NextResponse.json({ success: true, message: 'POS session reconciled and closed.' });
    }

    return NextResponse.json({ success: false, message: 'Unknown POS action.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
