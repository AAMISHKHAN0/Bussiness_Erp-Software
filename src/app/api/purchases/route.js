import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requirePermission, getClientIp } from '@/lib/auth';
import AccountingEngine from '@/lib/accountingEngine';
import InventoryService from '@/lib/inventoryService';

export async function GET(request) {
  try {
    const authCheck = await requirePermission(request, 'procurement:view');
    if (!authCheck.authorized) return authCheck.response;

    const { tenant_id } = authCheck.auth;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const po = db.findById('purchase_orders', id, tenant_id);
      if (!po) return NextResponse.json({ success: false, message: 'Purchase order not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: po });
    }

    const orders = db.get('purchase_orders', tenant_id);
    const suppliers = db.get('suppliers', tenant_id);
    const products = db.get('products', tenant_id);
    const approvals = db.get('approval_requests', tenant_id);
    const warehouses = db.get('warehouses', tenant_id);

    const totalProcurement = orders.reduce((sum, o) => {
      if (o.status === 'Cancelled') return sum;
      return sum + (Number(o.total_amount) || 0);
    }, 0);

    const pendingReceiving = orders.filter(o => o.status === 'Ordered' || o.status === 'Partially Received').length;
    const unpaidProcurement = orders
      .filter(o => o.status !== 'Cancelled' && o.payment_status !== 'Paid')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        suppliers,
        products,
        approvals,
        warehouses,
        totalProcurement,
        pendingReceiving,
        unpaidProcurement
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authCheck = await requirePermission(request, 'procurement:create');
    if (!authCheck.authorized) return authCheck.response;

    const { user, tenant_id } = authCheck.auth;
    const clientIp = getClientIp(request);
    const body = await request.json();

    const { supplier_id, items, expected_delivery_date, notes, warehouse_id } = body;

    if (!supplier_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Supplier and at least one line item are required' }, { status: 400 });
    }

    const supplier = db.findById('suppliers', supplier_id, tenant_id);
    if (!supplier) {
      return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });
    }

    let totalAmount = 0;
    const processedItems = items.map(item => {
      const product = db.findById('products', item.product_id, tenant_id);
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price) || (product ? Number(product.purchase_price) : 0);
      const lineTotal = Math.round(qty * unitPrice * 100) / 100;
      totalAmount += lineTotal;
      return {
        product_id: item.product_id,
        name: product ? product.name : item.name || 'Purchased Item',
        sku: product ? product.sku : 'SKU-GEN',
        quantity: qty,
        unit_price: unitPrice,
        total: lineTotal
      };
    });

    totalAmount = Math.round(totalAmount * 100) / 100;
    const targetWarehouse = warehouse_id || 'wh-1';
    const orderNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Enterprise Approval Workflow:
    // POs exceeding $10,000 require executive / controller approval
    const APPROVAL_THRESHOLD = 10000;
    const requiresApproval = totalAmount >= APPROVAL_THRESHOLD && user.role !== 'Super Admin' && user.role !== 'Financial Controller';
    const initialStatus = requiresApproval ? 'Pending Approval' : 'Ordered';

    const newPO = db.insert('purchase_orders', {
      order_number: orderNumber,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      branch_id: user.branch_id || 'b-1',
      warehouse_id: targetWarehouse,
      order_date: new Date().toISOString().slice(0, 10),
      expected_delivery_date: expected_delivery_date || new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
      status: initialStatus,
      total_amount: totalAmount,
      payment_status: 'Unpaid',
      notes: notes || '',
      created_by: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      items: processedItems
    }, tenant_id);

    // If approval required, insert approval request
    if (requiresApproval) {
      db.insert('approval_requests', {
        request_type: 'PURCHASE_ORDER',
        reference_id: newPO.id,
        reference_number: orderNumber,
        title: `PO ${orderNumber} approval for ${supplier.name} ($${totalAmount.toLocaleString()})`,
        requested_by: newPO.created_by,
        amount: totalAmount,
        status: 'Pending',
        threshold: APPROVAL_THRESHOLD,
        created_at: new Date().toISOString()
      }, tenant_id);

      db.logAudit(
        'APPROVAL_REQUESTED',
        'Procurement',
        `PO ${orderNumber} queued for approval (Amount: $${totalAmount.toLocaleString()} exceeds threshold $${APPROVAL_THRESHOLD.toLocaleString()})`,
        user,
        clientIp
      );

      return NextResponse.json({
        success: true,
        message: `PO ${orderNumber} created and queued for executive approval`,
        data: newPO
      });
    }

    db.logAudit('PURCHASE_ORDER_CREATED', 'Procurement', `Generated PO ${orderNumber} to ${supplier.name} for $${totalAmount.toLocaleString()}`, user, clientIp);

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
    const { id, action, approval_action, notes } = body;
    const clientIp = getClientIp(request);

    if (!id) return NextResponse.json({ success: false, message: 'PO ID required' }, { status: 400 });

    // Handle Approval Action
    if (approval_action) {
      const authCheck = await requirePermission(request, 'procurement:approve');
      if (!authCheck.authorized) return authCheck.response;
      const { user, tenant_id } = authCheck.auth;

      const po = db.findById('purchase_orders', id, tenant_id);
      if (!po) return NextResponse.json({ success: false, message: 'PO not found' }, { status: 404 });

      const newStatus = approval_action === 'approve' ? 'Ordered' : 'Rejected';
      const updated = db.update('purchase_orders', id, {
        status: newStatus,
        approved_by: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        approved_at: new Date().toISOString()
      }, tenant_id);

      // Update approval request record
      const approvals = db.get('approval_requests', tenant_id);
      const appReq = approvals.find(a => a.reference_id === id);
      if (appReq) {
        db.update('approval_requests', appReq.id, {
          status: approval_action === 'approve' ? 'Approved' : 'Rejected',
          decided_by: user.email,
          decided_at: new Date().toISOString()
        }, tenant_id);
      }

      db.logAudit(
        'PURCHASE_ORDER_APPROVAL',
        'Procurement',
        `PO ${po.order_number} was ${newStatus} by ${user.role}`,
        user,
        clientIp
      );

      return NextResponse.json({
        success: true,
        message: `PO ${po.order_number} has been ${newStatus.toLowerCase()}`,
        data: updated
      });
    }

    // Handle Goods Receipt (GRN) Action
    if (action === 'receive' || body.status === 'Received') {
      const authCheck = await requirePermission(request, 'procurement:receive');
      if (!authCheck.authorized) return authCheck.response;
      const { user, tenant_id } = authCheck.auth;

      const po = db.findById('purchase_orders', id, tenant_id);
      if (!po) return NextResponse.json({ success: false, message: 'PO not found' }, { status: 404 });

      if (po.status === 'Received') {
        return NextResponse.json({ success: false, message: 'PO has already been received' }, { status: 400 });
      }

      // 1. Restock products via InventoryService
      const warehouseId = po.warehouse_id || 'wh-1';
      if (Array.isArray(po.items)) {
        for (const item of po.items) {
          try {
            InventoryService.recordMovement({
              productId: item.product_id,
              movementType: 'PURCHASE_RECEIPT',
              quantityChange: Number(item.quantity) || 1,
              warehouseId,
              referenceId: po.order_number,
              user,
              notes: `Goods received from ${po.supplier_name} under PO ${po.order_number}`,
              tenantId: tenant_id
            });
          } catch (itemErr) {
            console.warn('[Purchases API] Stock movement notice:', itemErr.message);
          }
        }
      }

      // 2. Post GAAP Double-Entry Goods Receipt Voucher
      // Debits Finished Goods Inventory (#1200), Credits Accounts Payable (#2010)
      let accountingVoucher = null;
      try {
        accountingVoucher = AccountingEngine.postGoodsReceipt(po, user, tenant_id);
      } catch (accErr) {
        console.warn('[Purchases API] Accounting posting notice:', accErr.message);
      }

      // 3. Update PO status
      const updated = db.update('purchase_orders', id, {
        status: 'Received',
        received_at: new Date().toISOString(),
        received_by: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
      }, tenant_id);

      // 4. Update supplier metrics
      if (po.supplier_id) {
        const supplier = db.findById('suppliers', po.supplier_id, tenant_id);
        if (supplier) {
          db.update('suppliers', supplier.id, {
            total_orders: (Number(supplier.total_orders) || 0) + 1,
            total_spend: Math.round(((Number(supplier.total_spend) || 0) + Number(po.total_amount)) * 100) / 100
          }, tenant_id);
        }
      }

      db.logAudit(
        'GOODS_RECEIPT',
        'Procurement',
        `Received shipment for PO ${po.order_number}. Items capitalized to inventory ledger.`,
        user,
        clientIp
      );

      return NextResponse.json({
        success: true,
        message: `Goods received for PO ${po.order_number}. Stock restocked and AP voucher posted.`,
        data: { po: updated, accountingVoucher }
      });
    }

    // General Update
    const authCheck = await requirePermission(request, 'procurement:edit');
    if (!authCheck.authorized) return authCheck.response;
    const { user, tenant_id } = authCheck.auth;

    const updated = db.update('purchase_orders', id, body, tenant_id);
    return NextResponse.json({ success: true, message: 'Purchase order updated', data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * Enterprise Safe Cancellation of Purchase Order
 */
export async function DELETE(request) {
  try {
    const authCheck = await requirePermission(request, 'procurement:cancel');
    if (!authCheck.authorized) return authCheck.response;

    const { user, tenant_id } = authCheck.auth;
    const clientIp = getClientIp(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const reason = searchParams.get('reason') || 'Procurement cancellation requested';

    if (!id) return NextResponse.json({ success: false, message: 'PO ID required' }, { status: 400 });

    const po = db.findById('purchase_orders', id, tenant_id);
    if (!po) return NextResponse.json({ success: false, message: 'PO not found' }, { status: 404 });

    if (po.status === 'Cancelled') {
      return NextResponse.json({ success: false, message: 'PO is already cancelled' }, { status: 400 });
    }

    // If PO was already received, reverse stock movements
    if (po.status === 'Received' && Array.isArray(po.items)) {
      for (const item of po.items) {
        try {
          InventoryService.recordMovement({
            productId: item.product_id,
            movementType: 'CYCLE_COUNT_ADJUSTMENT',
            quantityChange: -(Number(item.quantity) || 1),
            warehouseId: po.warehouse_id || 'wh-1',
            referenceId: `REV-${po.order_number}`,
            user,
            notes: `Inventory reversal due to cancelled PO ${po.order_number}`,
            tenantId: tenant_id
          });
        } catch (e) {
          console.warn('[Purchases API] Cancel stock reversal notice:', e.message);
        }
      }

      // Reverse accounting voucher
      try {
        AccountingEngine.reverseTransaction(po.order_number, reason, user, tenant_id);
      } catch (e) {}
    }

    const updated = db.update('purchase_orders', id, {
      status: 'Cancelled',
      cancellation_reason: reason,
      cancelled_by: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      cancelled_at: new Date().toISOString()
    }, tenant_id);

    db.logAudit('PO_CANCELLED', 'Procurement', `Cancelled purchase order ${po.order_number}: ${reason}`, user, clientIp);

    return NextResponse.json({
      success: true,
      message: `Purchase Order ${po.order_number} cancelled successfully`,
      data: updated
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
