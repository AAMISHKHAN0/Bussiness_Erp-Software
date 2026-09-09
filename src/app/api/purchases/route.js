import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
  try {
    const orders = db.get('purchase_orders');
    const suppliers = db.get('suppliers');
    const products = db.get('products');

    return NextResponse.json({
      success: true,
      data: {
        orders,
        suppliers,
        products,
        totalProcurement: orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { supplier_id, items, expected_delivery_date, notes } = body;

    if (!supplier_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Supplier and at least one line item are required' }, { status: 400 });
    }

    const supplier = db.findById('suppliers', supplier_id);
    if (!supplier) {
      return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
    }

    let totalAmount = 0;
    const processedItems = items.map(item => {
      const product = db.findById('products', item.product_id);
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price) || (product ? Number(product.purchase_price) : 0);
      const lineTotal = qty * unitPrice;
      totalAmount += lineTotal;
      return {
        product_id: item.product_id,
        name: product ? product.name : item.name || 'Purchased Item',
        quantity: qty,
        unit_price: unitPrice,
        total: lineTotal
      };
    });

    const orderNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPO = db.insert('purchase_orders', {
      order_number: orderNumber,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      branch_id: 'b-1',
      order_date: new Date().toISOString().slice(0, 10),
      expected_delivery_date: expected_delivery_date || new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
      status: 'Ordered',
      total_amount: totalAmount,
      payment_status: 'Unpaid',
      notes: notes || '',
      created_by: 'Procurement Director',
      items: processedItems
    });

    db.logAudit('PURCHASE_ORDER_CREATED', 'Procurement', `Generated PO ${orderNumber} to ${supplier.name} for $${totalAmount}`);

    return NextResponse.json({
      success: true,
      message: `Purchase Order ${orderNumber} created successfully`,
      data: newPO
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) return NextResponse.json({ success: false, message: 'PO ID required' }, { status: 400 });

    const po = db.findById('purchase_orders', id);
    if (!po) return NextResponse.json({ success: false, message: 'PO not found' }, { status: 404 });

    // When receiving goods, auto-increment inventory!
    if (action === 'receive' || body.status === 'Received') {
      if (po.status !== 'Received' && Array.isArray(po.items)) {
        for (const item of po.items) {
          const product = db.findById('products', item.product_id);
          if (product) {
            const newQty = Number(product.quantity) + Number(item.quantity);
            db.update('products', product.id, {
              quantity: newQty,
              status: newQty <= Number(product.min_stock_level) ? 'Low Stock Alert' : 'In Stock'
            });
          }
        }
      }
      const updated = db.update('purchase_orders', id, {
        status: 'Received',
        payment_status: 'Paid',
        received_at: new Date().toISOString()
      });
      db.logAudit('GOODS_RECEIPT', 'Procurement', `Received shipment for PO ${po.order_number}. Restocked items.`);
      return NextResponse.json({ success: true, message: 'Goods received and inventory updated', data: updated });
    }

    const updated = db.update('purchase_orders', id, body);
    return NextResponse.json({ success: true, message: 'PO updated', data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
