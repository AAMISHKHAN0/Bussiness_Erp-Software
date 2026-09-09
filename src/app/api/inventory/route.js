import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let products = db.get('products');

    if (category && category !== 'All') {
      products = products.filter(p => p.category_name === category || p.category_id === category);
    }
    if (status === 'critical') {
      products = products.filter(p => Number(p.quantity) <= Number(p.min_stock_level));
    }
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) ||
        (p.location && p.location.toLowerCase().includes(q))
      );
    }

    const categories = db.get('categories');
    const suppliers = db.get('suppliers');

    return NextResponse.json({
      success: true,
      data: {
        products,
        categories,
        suppliers,
        totalItems: products.length
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, sku, category_name, purchase_price, selling_price, quantity, min_stock_level, location, supplier_name } = body;

    if (!name || !sku) {
      return NextResponse.json({ success: false, message: 'Product name and SKU are required.' }, { status: 400 });
    }

    const newProduct = db.insert('products', {
      name,
      sku: sku.toUpperCase(),
      barcode: body.barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category_name: category_name || 'General Hardware',
      unit: body.unit || 'Units',
      purchase_price: Number(purchase_price) || 0,
      selling_price: Number(selling_price) || 0,
      quantity: Number(quantity) || 0,
      min_stock_level: Number(min_stock_level) || 5,
      location: location || 'Warehouse Main',
      supplier_name: supplier_name || 'Direct Procurement',
      status: Number(quantity) <= Number(min_stock_level || 5) ? 'Low Stock Alert' : 'In Stock',
      is_active: true
    });

    db.logAudit('PRODUCT_CREATED', 'Inventory', `Added product ${name} (${sku}) with initial stock ${quantity}`);

    return NextResponse.json({ success: true, message: 'Product created successfully', data: newProduct });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, adjustment, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 });
    }

    const product = db.findById('products', id);
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Stock adjustment flow
    if (adjustment !== undefined) {
      const newQty = Math.max(0, Number(product.quantity) + Number(adjustment));
      const updated = db.update('products', id, {
        quantity: newQty,
        status: newQty <= Number(product.min_stock_level) ? 'Critical Stock' : 'In Stock'
      });
      db.logAudit('STOCK_ADJUSTMENT', 'Inventory', `Adjusted ${product.name} stock by ${adjustment > 0 ? '+' : ''}${adjustment}. New count: ${newQty}`);
      return NextResponse.json({ success: true, message: 'Stock adjusted successfully', data: updated });
    }

    // General update
    const updated = db.update('products', id, {
      ...updates,
      status: (updates.quantity !== undefined ? Number(updates.quantity) : product.quantity) <= (updates.min_stock_level !== undefined ? Number(updates.min_stock_level) : product.min_stock_level) ? 'Low Stock Alert' : 'In Stock'
    });

    db.logAudit('PRODUCT_UPDATED', 'Inventory', `Updated specifications for ${product.name}`);
    return NextResponse.json({ success: true, message: 'Product updated successfully', data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 });
    }
    const product = db.findById('products', id);
    db.delete('products', id);
    db.logAudit('PRODUCT_DELETED', 'Inventory', `Deleted product ${product?.name || id}`);
    return NextResponse.json({ success: true, message: 'Product removed from catalog' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
