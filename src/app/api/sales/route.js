import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const order = db.findById('sales_orders', id);
      if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: order });
    }

    const orders = db.get('sales_orders');
    const customers = db.get('customers');
    const products = db.get('products');

    return NextResponse.json({
      success: true,
      data: {
        orders,
        customers,
        products,
        totalSales: orders.reduce((sum, o) => sum + (Number(o.net_amount) || 0), 0)
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { customer_id, items, payment_method, notes, discount_amount } = body;

    if (!customer_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Customer and at least one line item are required' }, { status: 400 });
    }

    const customer = db.findById('customers', customer_id);
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    // Compute totals and auto-deduct stock
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = db.findById('products', item.product_id);
      if (!product) continue;
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price) || Number(product.selling_price) || 0;
      const lineTotal = qty * unitPrice;
      totalAmount += lineTotal;

      // Auto-deduct inventory
      const newQty = Math.max(0, Number(product.quantity) - qty);
      db.update('products', product.id, {
        quantity: newQty,
        status: newQty <= Number(product.min_stock_level) ? 'Low Stock Alert' : 'In Stock'
      });

      processedItems.push({
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        quantity: qty,
        unit_price: unitPrice,
        total: lineTotal
      });
    }

    const settings = db.getSettings();
    const taxRate = (settings.default_tax_rate || 8.5) / 100;
    const discount = Number(discount_amount) || 0;
    const taxableAmount = Math.max(0, totalAmount - discount);
    const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
    const netAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    const orderNumber = `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = db.insert('sales_orders', {
      order_number: orderNumber,
      customer_id: customer.id,
      customer_name: customer.name || customer.company_name,
      branch_id: 'b-1',
      order_date: new Date().toISOString().slice(0, 10),
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'Confirmed',
      total_amount: totalAmount,
      tax_amount: taxAmount,
      discount_amount: discount,
      net_amount: netAmount,
      payment_status: 'Pending',
      payment_method: payment_method || 'Net-30 Invoice',
      notes: notes || '',
      created_by: 'Authorized Sales Agent',
      items: processedItems
    });

    // Update customer total spend
    db.update('customers', customer.id, {
      total_spent: (Number(customer.total_spent) || 0) + netAmount,
      current_balance: (Number(customer.current_balance) || 0) + netAmount
    });

    db.logAudit('SALES_ORDER_CREATED', 'Sales', `Created Order ${orderNumber} for ${customer.name} totaling ${settings.currency_symbol || '$'}${netAmount}`);

    return NextResponse.json({
      success: true,
      message: `Sales Order ${orderNumber} generated successfully`,
      data: newOrder
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status, payment_status } = body;

    if (!id) return NextResponse.json({ success: false, message: 'Order ID required' }, { status: 400 });

    const order = db.findById('sales_orders', id);
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    const updates = {};
    if (status) updates.status = status;
    if (payment_status) updates.payment_status = payment_status;

    const updated = db.update('sales_orders', id, updates);
    db.logAudit('SALES_ORDER_STATUS', 'Sales', `Updated Order ${order.order_number} to Status: ${status || order.status}, Payment: ${payment_status || order.payment_status}`);

    return NextResponse.json({ success: true, message: 'Order status updated', data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
