import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requirePermission, getClientIp } from '@/lib/auth';
import InventoryService from '@/lib/inventoryService';

export async function GET(request) {
  try {
    const authCheck = await requirePermission(request, 'inventory:view');
    if (!authCheck.authorized) return authCheck.response;

    const { tenant_id } = authCheck.auth;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const warehouseId = searchParams.get('warehouse_id');

    let products = db.get('products', tenant_id);

    if (category && category !== 'All') {
      products = products.filter(p => p.category_name === category || p.category_id === category);
    }
    if (status === 'critical') {
      products = products.filter(p => Number(p.quantity) <= Number(p.min_stock_level));
    }
    if (warehouseId && warehouseId !== 'All') {
      products = products.filter(p => p.location?.includes(warehouseId) || p.warehouse_id === warehouseId);
    }
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    const categories = db.get('categories', tenant_id);
    const suppliers = db.get('suppliers', tenant_id);
    const warehouses = db.get('warehouses', tenant_id);
    const stockMovements = db.get('stock_movements', tenant_id);

    const totalUnits = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    const inventoryValuation = products.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.purchase_price) || 0)), 0);
    const criticalItemsCount = products.filter(p => Number(p.quantity) <= Number(p.min_stock_level)).length;

    return NextResponse.json({
      success: true,
      data: {
        products,
        categories,
        suppliers,
        warehouses,
        stockMovements: stockMovements.slice(0, 50), // Most recent 50 ledger movements
        totalItems: products.length,
        totalUnits,
        inventoryValuation: Math.round(inventoryValuation * 100) / 100,
        criticalItemsCount
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

    // 1. Warehouse Transfer Flow
    if (action === 'transfer') {
      const authCheck = await requirePermission(request, 'inventory:transfer');
      if (!authCheck.authorized) return authCheck.response;
      const { user, tenant_id } = authCheck.auth;

      const { product_id, source_warehouse_id, target_warehouse_id, quantity, notes } = body;
      if (!product_id || !source_warehouse_id || !target_warehouse_id || !quantity) {
        return NextResponse.json({
          success: false,
          message: 'Product ID, source facility, destination facility, and transfer quantity are required.'
        }, { status: 400 });
      }

      const transferResult = InventoryService.transferStock({
        productId: product_id,
        sourceWarehouseId: source_warehouse_id,
        targetWarehouseId: target_warehouse_id,
        quantity,
        user,
        notes,
        tenantId: tenant_id
      });

      return NextResponse.json({
        success: true,
        message: `Transferred ${quantity} units successfully under Ref: ${transferResult.transferReference}`,
        data: transferResult
      });
    }

    // 2. Standard Product Creation Flow
    const authCheck = await requirePermission(request, 'inventory:create');
    if (!authCheck.authorized) return authCheck.response;
    const { user, tenant_id } = authCheck.auth;

    const {
      name, sku, category_name, purchase_price, selling_price,
      quantity, min_stock_level, location, supplier_name, unit, barcode
    } = body;

    if (!name || !sku) {
      return NextResponse.json({ success: false, message: 'Product name and SKU are mandatory.' }, { status: 400 });
    }

    // Check duplicate SKU in tenant
    const existingProducts = db.get('products', tenant_id);
    if (existingProducts.some(p => p.sku.toUpperCase() === sku.toUpperCase())) {
      return NextResponse.json({ success: false, message: `Product with SKU ${sku.toUpperCase()} already exists.` }, { status: 409 });
    }

    const initialQty = Number(quantity) || 0;
    const minStock = Number(min_stock_level) || 5;

    const newProduct = db.insert('products', {
      name,
      sku: sku.toUpperCase(),
      barcode: barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category_name: category_name || 'General Inventory',
      unit: unit || 'Units',
      purchase_price: Number(purchase_price) || 0,
      selling_price: Number(selling_price) || 0,
      quantity: initialQty,
      min_stock_level: minStock,
      location: location || 'Main Warehouse Bay A',
      warehouse_id: body.warehouse_id || 'wh-1',
      supplier_name: supplier_name || 'Global Logistics Supply',
      status: initialQty <= minStock ? 'Low Stock Alert' : 'In Stock',
      is_active: true
    }, tenant_id);

    // If initial stock was provided, record initial ledger movement
    if (initialQty > 0) {
      try {
        InventoryService.recordMovement({
          productId: newProduct.id,
          movementType: 'CYCLE_COUNT_ADJUSTMENT',
          quantityChange: initialQty,
          warehouseId: newProduct.warehouse_id,
          referenceId: `INIT-${newProduct.sku}`,
          user,
          notes: 'Initial catalog intake and opening stock count',
          tenantId: tenant_id
        });
      } catch (e) {
        console.warn('[Inventory API] Initial stock movement notice:', e.message);
      }
    }

    db.logAudit(
      'PRODUCT_CREATED',
      'Inventory',
      `Registered product ${name} (${newProduct.sku}) with opening balance of ${initialQty} units`,
      user,
      clientIp
    );

    return NextResponse.json({ success: true, message: 'Product created and registered to catalog', data: newProduct });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, adjustment, reason, ...updates } = body;
    const clientIp = getClientIp(request);

    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 });
    }

    // 1. Cycle Count / Stock Adjustment Flow
    if (adjustment !== undefined) {
      const authCheck = await requirePermission(request, 'inventory:adjust');
      if (!authCheck.authorized) return authCheck.response;
      const { user, tenant_id } = authCheck.auth;

      const product = db.findById('products', id, tenant_id);
      if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

      const delta = Number(adjustment);
      const movement = InventoryService.recordMovement({
        productId: product.id,
        movementType: 'CYCLE_COUNT_ADJUSTMENT',
        quantityChange: delta,
        warehouseId: body.warehouse_id || product.warehouse_id || 'wh-1',
        referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
        user,
        notes: reason || 'Routine inventory audit count adjustment',
        tenantId: tenant_id
      });

      const updatedProduct = db.findById('products', id, tenant_id);
      return NextResponse.json({
        success: true,
        message: `Inventory adjusted by ${delta > 0 ? '+' : ''}${delta}. Ledger movement recorded.`,
        data: { product: updatedProduct, movement }
      });
    }

    // 2. Standard Specification Edit Flow
    const authCheck = await requirePermission(request, 'inventory:edit');
    if (!authCheck.authorized) return authCheck.response;
    const { user, tenant_id } = authCheck.auth;

    const product = db.findById('products', id, tenant_id);
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    const newQty = updates.quantity !== undefined ? Number(updates.quantity) : product.quantity;
    const minStock = updates.min_stock_level !== undefined ? Number(updates.min_stock_level) : product.min_stock_level;

    const updated = db.update('products', id, {
      ...updates,
      status: newQty <= minStock ? 'Low Stock Alert' : 'In Stock'
    }, tenant_id);

    db.logAudit('PRODUCT_UPDATED', 'Inventory', `Updated specifications for ${product.name} (${product.sku})`, user, clientIp);
    return NextResponse.json({ success: true, message: 'Product specifications updated successfully', data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const authCheck = await requirePermission(request, 'inventory:delete');
    if (!authCheck.authorized) return authCheck.response;
    const { user, tenant_id } = authCheck.auth;
    const clientIp = getClientIp(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 });

    const product = db.findById('products', id, tenant_id);
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });

    // Protect catalog if stock is still held
    if (Number(product.quantity) > 0) {
      return NextResponse.json({
        success: false,
        message: `Cannot delete product with active inventory (${product.quantity} units on hand). Adjust stock to zero first.`
      }, { status: 400 });
    }

    db.delete('products', id, tenant_id);
    db.logAudit('PRODUCT_DELETED', 'Inventory', `Removed product catalog entry ${product.name} (${product.sku})`, user, clientIp);

    return NextResponse.json({ success: true, message: `Product ${product.sku} removed from catalog` });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
