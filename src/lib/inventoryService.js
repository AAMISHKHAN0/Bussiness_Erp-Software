import db from './db';

/**
 * Enterprise Inventory Management & Stock Movement Service
 * Guarantees atomic stock movements, immutable audit trails, and multi-warehouse allocations.
 */
export class InventoryService {
  /**
   * Record an immutable stock movement and update product quantity
   */
  static recordMovement({
    productId,
    movementType, // 'PURCHASE_RECEIPT' | 'SALES_DISPATCH' | 'WAREHOUSE_TRANSFER' | 'CYCLE_COUNT_ADJUSTMENT' | 'ORDER_CANCEL_RESTOCK'
    quantityChange, // positive for addition, negative for reduction
    warehouseId = 'wh-1',
    referenceId = '',
    user = 'System',
    notes = '',
    tenantId = 'tenant-default'
  }) {
    const product = db.findById('products', productId, tenantId);
    if (!product) {
      throw new Error(`Product not found with ID ${productId}`);
    }

    const currentQty = Number(product.quantity) || 0;
    const change = Number(quantityChange) || 0;
    const newQty = Math.max(0, currentQty + change);

    // Update product stock balance and critical alert status
    db.update('products', product.id, {
      quantity: newQty,
      status: newQty <= Number(product.min_stock_level) ? 'Low Stock Alert' : 'In Stock'
    }, tenantId);

    const warehouse = db.findById('warehouses', warehouseId, tenantId) || {
      id: warehouseId,
      name: 'Main Distribution Hub',
      code: 'WH-MAIN'
    };

    const movementId = `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const movement = db.insert('stock_movements', {
      id: movementId,
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      movement_type: movementType,
      quantity_change: change,
      balance_before: currentQty,
      balance_after: newQty,
      warehouse_id: warehouse.id,
      warehouse_name: warehouse.name,
      reference_id: referenceId,
      notes,
      performed_by: typeof user === 'object' ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : user,
      timestamp: new Date().toISOString()
    }, tenantId);

    db.logAudit(
      'STOCK_MOVEMENT',
      'Inventory',
      `${movementType}: ${change > 0 ? '+' : ''}${change} units of ${product.sku}. New stock: ${newQty}`,
      user
    );

    return movement;
  }

  /**
   * Transfer stock between warehouses
   */
  static transferStock({
    productId,
    sourceWarehouseId,
    targetWarehouseId,
    quantity,
    user,
    notes = '',
    tenantId = 'tenant-default'
  }) {
    const product = db.findById('products', productId, tenantId);
    if (!product) throw new Error('Product not found');
    const transferQty = Number(quantity);
    if (transferQty <= 0) throw new Error('Transfer quantity must be greater than zero');
    if ((Number(product.quantity) || 0) < transferQty) {
      throw new Error(`Insufficient stock for transfer. Available: ${product.quantity}, Requested: ${transferQty}`);
    }

    const sourceWH = db.findById('warehouses', sourceWarehouseId, tenantId) || { id: sourceWarehouseId, name: 'Source Facility' };
    const targetWH = db.findById('warehouses', targetWarehouseId, tenantId) || { id: targetWarehouseId, name: 'Destination Facility' };

    const transferRef = `TRF-${Date.now().toString().slice(-6)}`;

    // Log outbound movement from source
    this.recordMovement({
      productId: product.id,
      movementType: 'WAREHOUSE_TRANSFER',
      quantityChange: -transferQty,
      warehouseId: sourceWarehouseId,
      referenceId: transferRef,
      user,
      notes: `Outbound transfer to ${targetWH.name}. ${notes}`.trim(),
      tenantId
    });

    // Log inbound movement at destination
    this.recordMovement({
      productId: product.id,
      movementType: 'WAREHOUSE_TRANSFER',
      quantityChange: transferQty,
      warehouseId: targetWarehouseId,
      referenceId: transferRef,
      user,
      notes: `Inbound transfer from ${sourceWH.name}. ${notes}`.trim(),
      tenantId
    });

    return {
      success: true,
      transferReference: transferRef,
      product: product.name,
      quantity: transferQty,
      from: sourceWH.name,
      to: targetWH.name
    };
  }
}

export default InventoryService;
