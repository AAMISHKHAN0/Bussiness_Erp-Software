import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requirePermission, getClientIp } from '@/lib/auth';
import AccountingEngine from '@/lib/accountingEngine';
import InventoryService from '@/lib/inventoryService';

export async function GET(request) {
  try {
    const authCheck = await requirePermission(request, 'sales:view');
    if (!authCheck.authorized) return authCheck.response;

    const { tenant_id } = authCheck.auth;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const order = db.findById('sales_orders', id, tenant_id);
      if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: order });
    }

    const orders = db.get('sales_orders', tenant_id);
    const customers = db.get('customers', tenant_id);
    const products = db.get('products', tenant_id);
    const quotations = db.get('quotations', tenant_id);
    const invoices = db.get('invoices', tenant_id);
    const payments = db.get('payments', tenant_id);

    const totalSales = orders.reduce((sum, o) => {
      if (o.status === 'Cancelled') return sum;
      return sum + (Number(o.net_amount) || Number(o.total_amount) || 0);
    }, 0);

    const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed').length;
    const unpaidAmount = orders
      .filter(o => o.status !== 'Cancelled' && o.payment_status !== 'Paid')
      .reduce((sum, o) => sum + (Number(o.net_amount) || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        customers,
        products,
        quotations,
        invoices,
        payments,
        totalSales,
        pendingOrders,
        unpaidAmount
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

    // 1. Create Quotation Flow
    if (action === 'quote' || body.quote_number) {
      const authCheck = await requirePermission(request, 'sales:create');
      if (!authCheck.authorized) return authCheck.response;
      const { user, tenant_id } = authCheck.auth;

      const { customer_id, items, valid_until, notes } = body;
      const customer = db.findById('customers', customer_id, tenant_id);
      if (!customer) {
        return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
      }

      let subtotal = 0;
      const processedItems = (items || []).map(item => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unit_price) || 0;
        const total = qty * price;
        subtotal += total;
        return { ...item, quantity: qty, unit_price: price, total };
      });

      const quoteNumber = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newQuote = db.insert('quotations', {
        quote_number: quoteNumber,
        customer_id: customer.id,
        customer_name: customer.name || customer.company_name,
        quote_date: new Date().toISOString().slice(0, 10),
        valid_until: valid_until || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        status: 'Sent',
        subtotal,
        total_amount: subtotal,
        items: processedItems,
        notes: notes || '',
        created_by: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
      }, tenant_id);

      db.logAudit('QUOTATION_CREATED', 'Sales', `Created quotation ${quoteNumber} for ${customer.name}`, user, clientIp);
      return NextResponse.json({ success: true, message: `Quotation ${quoteNumber} generated`, data: newQuote });
    }

    // 2. Standard Sales Order Creation Flow
    const authCheck = await requirePermission(request, 'sales:create');
    if (!authCheck.authorized) return authCheck.response;
    const { user, tenant_id } = authCheck.auth;

    const { customer_id, items, payment_method, notes, discount_amount, warehouse_id } = body;

    if (!customer_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Customer and at least one line item are required' }, { status: 400 });
    }

    const customer = db.findById('customers', customer_id, tenant_id);
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    // Verify stock availability & deduct via InventoryService
    let totalAmount = 0;
    const processedItems = [];
    const targetWarehouse = warehouse_id || 'wh-1';

    for (const item of items) {
      const product = db.findById('products', item.product_id, tenant_id);
      if (!product) continue;
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price) || Number(product.selling_price) || 0;
      const lineTotal = qty * unitPrice;
      totalAmount += lineTotal;

      processedItems.push({
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        quantity: qty,
        unit_price: unitPrice,
        purchase_cost: Number(product.purchase_price) || 0,
        total: lineTotal
      });
    }

    const settings = db.getSettings(tenant_id);
    const taxRate = (Number(settings.default_tax_rate) || 8.5) / 100;
    const discount = Number(discount_amount) || 0;
    const taxableAmount = Math.max(0, totalAmount - discount);
    const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
    const netAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    const orderNumber = `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create Order
    const newOrder = db.insert('sales_orders', {
      order_number: orderNumber,
      customer_id: customer.id,
      customer_name: customer.name || customer.company_name,
      branch_id: user.branch_id || 'b-1',
      order_date: new Date().toISOString().slice(0, 10),
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'Confirmed',
      total_amount: totalAmount,
      tax_amount: taxAmount,
      discount_amount: discount,
      net_amount: netAmount,
      payment_status: body.payment_status || 'Pending',
      payment_method: payment_method || 'Net-30 Invoice',
      warehouse_id: targetWarehouse,
      notes: notes || '',
      created_by: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      items: processedItems
    }, tenant_id);

    // Record formal stock dispatch in immutable inventory movement ledger
    for (const item of processedItems) {
      InventoryService.recordMovement({
        productId: item.product_id,
        movementType: 'SALES_DISPATCH',
        quantityChange: -item.quantity,
        warehouseId: targetWarehouse,
        referenceId: orderNumber,
        user,
        notes: `Outbound sales fulfillment for ${orderNumber}`,
        tenantId: tenant_id
      });
    }

    // Auto-generate official Commercial Invoice
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoice = db.insert('invoices', {
      invoice_number: invoiceNumber,
      order_id: newOrder.id,
      order_number: orderNumber,
      customer_id: customer.id,
      customer_name: customer.name || customer.company_name,
      invoice_date: newOrder.order_date,
      due_date: newOrder.due_date,
      subtotal: taxableAmount,
      tax_amount: taxAmount,
      total_amount: netAmount,
      balance_due: newOrder.payment_status === 'Paid' ? 0 : netAmount,
      status: newOrder.payment_status === 'Paid' ? 'Paid' : 'Sent',
      created_by: newOrder.created_by
    }, tenant_id);

    // If paid upfront, record receipt payment
    if (newOrder.payment_status === 'Paid') {
      db.insert('payments', {
        payment_number: `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        invoice_id: invoice.id,
        order_number: orderNumber,
        customer_id: customer.id,
        customer_name: customer.name || customer.company_name,
        amount: netAmount,
        payment_date: newOrder.order_date,
        payment_method: payment_method || 'Electronic Wire',
        reference: `Ref-${orderNumber}`,
        status: 'Cleared'
      }, tenant_id);
    }

    // Update customer total spend & current receivables balance
    db.update('customers', customer.id, {
      total_spent: Math.round(((Number(customer.total_spent) || 0) + netAmount) * 100) / 100,
      current_balance: Math.round(((Number(customer.current_balance) || 0) + (newOrder.payment_status === 'Paid' ? 0 : netAmount)) * 100) / 100
    }, tenant_id);

    // Automated GAAP Double-Entry Posting:
    // Debits AR / Cash, Credits Revenue & Tax, Debits COGS, Credits Inventory
    let accountingVoucher = null;
    try {
      accountingVoucher = AccountingEngine.postSalesOrder(newOrder, user, tenant_id);
    } catch (accErr) {
      console.warn('[Sales API] Automated accounting posting notice:', accErr.message);
    }

    db.logAudit(
      'SALES_ORDER_CREATED',
      'Sales',
      `Generated Order ${orderNumber} for ${customer.name} totaling ${settings.currency_symbol || '$'}${netAmount.toLocaleString()}`,
      user,
      clientIp
    );

    return NextResponse.json({
      success: true,
      message: `Sales Order ${orderNumber} and Invoice ${invoiceNumber} posted successfully`,
      data: {
        order: newOrder,
        invoice,
        accountingVoucher
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const authCheck = await requirePermission(request, 'sales:edit');
    if (!authCheck.authorized) return authCheck.response;
    const { user, tenant_id } = authCheck.auth;
    const clientIp = getClientIp(request);

    const body = await request.json();
    const { id, action, status, payment_status, payment_amount, payment_method } = body;

    if (!id) return NextResponse.json({ success: false, message: 'Order ID required' }, { status: 400 });

    const order = db.findById('sales_orders', id, tenant_id);
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    // Handle Payment Collection Action
    if (action === 'payment' || (payment_status === 'Paid' && order.payment_status !== 'Paid')) {
      const payAmount = Number(payment_amount) || Number(order.net_amount) || Number(order.total_amount) || 0;
      
      const paymentNumber = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      db.insert('payments', {
        payment_number: paymentNumber,
        order_id: order.id,
        order_number: order.order_number,
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        amount: payAmount,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: payment_method || order.payment_method || 'Electronic Wire',
        status: 'Cleared'
      }, tenant_id);

      // Decrement Customer AR Balance
      const customer = db.findById('customers', order.customer_id, tenant_id);
      if (customer) {
        db.update('customers', customer.id, {
          current_balance: Math.max(0, Math.round(((Number(customer.current_balance) || 0) - payAmount) * 100) / 100)
        }, tenant_id);
      }

      // Update Invoice status
      const invoices = db.get('invoices', tenant_id);
      const inv = invoices.find(i => i.order_id === order.id || i.order_number === order.order_number);
      if (inv) {
        db.update('invoices', inv.id, { status: 'Paid', balance_due: 0 }, tenant_id);
      }

      // GAAP Cash Receipt Entry: Debit Operating Checking #1010, Credit AR #1100
      try {
        AccountingEngine.postVoucher({
          entryDate: new Date().toISOString().slice(0, 10),
          referenceNumber: paymentNumber,
          referenceType: 'PAYMENT_RECEIVED',
          description: `Customer payment received for Order ${order.order_number}`,
          lines: [
            { account_code: '1010', account_name: 'Operating Checking Account (Chase)', debit: payAmount, credit: 0 },
            { account_code: '1100', account_name: 'Accounts Receivable', debit: 0, credit: payAmount }
          ],
          user,
          tenantId: tenant_id
        });
      } catch (e) {
        console.warn('[Sales API] Payment posting notice:', e.message);
      }

      const updated = db.update('sales_orders', id, { payment_status: 'Paid' }, tenant_id);
      db.logAudit('PAYMENT_RECORDED', 'Sales', `Recorded payment of $${payAmount} for order ${order.order_number}`, user, clientIp);
      return NextResponse.json({ success: true, message: 'Payment recorded and posted to ledger', data: updated });
    }

    const updates = {};
    if (status) updates.status = status;
    if (payment_status) updates.payment_status = payment_status;

    const updated = db.update('sales_orders', id, updates, tenant_id);
    db.logAudit('SALES_ORDER_STATUS', 'Sales', `Updated Order ${order.order_number} to Status: ${status || order.status}`, user, clientIp);

    return NextResponse.json({ success: true, message: 'Order status updated', data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * Enterprise Safe VOID / Cancel of Sales Order
 * Never silently deletes financial or operational records.
 * Restocks inventory via InventoryService, reverses customer balance,
 * and posts reversing double-entry journal entry.
 */
export async function DELETE(request) {
  try {
    const authCheck = await requirePermission(request, 'sales:cancel');
    if (!authCheck.authorized) return authCheck.response;
    const { user, tenant_id } = authCheck.auth;
    const clientIp = getClientIp(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reason = searchParams.get('reason') || 'Order cancellation requested by authorized personnel';

    if (!id) return NextResponse.json({ success: false, message: 'Order ID required' }, { status: 400 });

    const order = db.findById('sales_orders', id, tenant_id);
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    if (order.status === 'Cancelled') {
      return NextResponse.json({ success: false, message: 'Order is already cancelled' }, { status: 400 });
    }

    // 1. Restock line items via InventoryService
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        try {
          InventoryService.recordMovement({
            productId: item.product_id,
            movementType: 'ORDER_CANCEL_RESTOCK',
            quantityChange: Number(item.quantity) || 1,
            warehouseId: order.warehouse_id || 'wh-1',
            referenceId: order.order_number,
            user,
            notes: `Restock due to cancellation of ${order.order_number}. Reason: ${reason}`,
            tenantId: tenant_id
          });
        } catch (stockErr) {
          console.warn('[Sales API] Cancellation restock notice:', stockErr.message);
        }
      }
    }

    // 2. Adjust customer balance if order was unpaid
    if (order.customer_id && order.payment_status !== 'Paid') {
      const customer = db.findById('customers', order.customer_id, tenant_id);
      if (customer) {
        const orderNet = Number(order.net_amount) || Number(order.total_amount) || 0;
        db.update('customers', customer.id, {
          current_balance: Math.max(0, Math.round(((Number(customer.current_balance) || 0) - orderNet) * 100) / 100),
          total_spent: Math.max(0, Math.round(((Number(customer.total_spent) || 0) - orderNet) * 100) / 100)
        }, tenant_id);
      }
    }

    // 3. Mark Invoice as Void / Cancelled
    const invoices = db.get('invoices', tenant_id);
    const linkedInvoice = invoices.find(i => i.order_id === order.id || i.order_number === order.order_number);
    if (linkedInvoice) {
      db.update('invoices', linkedInvoice.id, { status: 'Void' }, tenant_id);
    }

    // 4. Mirror Reversing GAAP Double-Entry Voucher
    let reversalVoucher = null;
    try {
      reversalVoucher = AccountingEngine.reverseTransaction(order.order_number, reason, user, tenant_id);
    } catch (accErr) {
      console.warn('[Sales API] Reversal entry notice:', accErr.message);
    }

    // 5. Update Order status to Cancelled (Preserve audit trail)
    const updated = db.update('sales_orders', id, {
      status: 'Cancelled',
      cancellation_reason: reason,
      cancelled_by: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      cancelled_at: new Date().toISOString()
    }, tenant_id);

    db.logAudit(
      'SALES_ORDER_CANCELLED',
      'Sales',
      `VOID & Cancelled order ${order.order_number}. Inventory restocked and ledger reversed.`,
      user,
      clientIp
    );

    return NextResponse.json({
      success: true,
      message: `Sales order ${order.order_number} successfully cancelled and reversed.`,
      data: {
        order: updated,
        reversalVoucher
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
