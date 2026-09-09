import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requirePermission, getClientIp } from '@/lib/auth';

export async function GET(request) {
  try {
    const authCheck = await requirePermission(request, 'vendors:view');
    if (!authCheck.authorized) return authCheck.response;

    const { tenant_id } = authCheck.auth;
    const suppliers = db.get('suppliers', tenant_id);
    return NextResponse.json({ success: true, data: suppliers });
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
    const { name, contact_person, email, phone, address, category, rating } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Vendor name and contact email required' }, { status: 400 });
    }

    const existing = db.get('suppliers', tenant_id).find(s => s.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      return NextResponse.json({ success: false, message: `Supplier with email ${email} already enrolled` }, { status: 409 });
    }

    const newVendor = db.insert('suppliers', {
      name,
      contact_person: contact_person || name,
      email,
      phone: phone || '',
      address: address || '',
      tax_number: body.tax_number || `VND-${Math.floor(100000 + Math.random() * 900000)}`,
      category: category || 'Industrial Logistics',
      rating: Number(rating) || 4.8,
      total_orders: 0,
      total_spend: 0,
      status: 'Active'
    }, tenant_id);

    db.logAudit('VENDOR_REGISTERED', 'Procurement', `Enrolled new supplier: ${name}`, user, clientIp);
    return NextResponse.json({ success: true, message: 'Supplier registered', data: newVendor });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const authCheck = await requirePermission(request, 'procurement:edit');
    if (!authCheck.authorized) return authCheck.response;
    const { user, tenant_id } = authCheck.auth;
    const clientIp = getClientIp(request);

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, message: 'Vendor ID required' }, { status: 400 });

    const supplier = db.findById('suppliers', id, tenant_id);
    if (!supplier) return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });

    const updated = db.update('suppliers', id, updates, tenant_id);
    db.logAudit('VENDOR_UPDATED', 'Procurement', `Updated supplier ${supplier.name}`, user, clientIp);
    return NextResponse.json({ success: true, message: 'Supplier details updated', data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const authCheck = await requirePermission(request, 'procurement:edit');
    if (!authCheck.authorized) return authCheck.response;
    const { user, tenant_id } = authCheck.auth;
    const clientIp = getClientIp(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Vendor ID required' }, { status: 400 });

    const supplier = db.findById('suppliers', id, tenant_id);
    if (!supplier) return NextResponse.json({ success: false, message: 'Supplier not found' }, { status: 404 });

    // Check if supplier has open POs
    const pos = db.get('purchase_orders', tenant_id);
    const activePOs = pos.filter(po => po.supplier_id === id && po.status !== 'Received' && po.status !== 'Cancelled');
    if (activePOs.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Cannot delete supplier with ${activePOs.length} active purchase orders. Settle or cancel open POs first.`
      }, { status: 400 });
    }

    db.delete('suppliers', id, tenant_id);
    db.logAudit('VENDOR_DELETED', 'Procurement', `Removed supplier record for ${supplier.name}`, user, clientIp);
    return NextResponse.json({ success: true, message: 'Supplier removed' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
