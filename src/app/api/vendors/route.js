import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const suppliers = db.get('suppliers');
  return NextResponse.json({ success: true, data: suppliers });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, contact_person, email, phone, address, category, rating } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Vendor name and email required' }, { status: 400 });
    }

    const newVendor = db.insert('suppliers', {
      name,
      contact_person: contact_person || name,
      email,
      phone: phone || '',
      address: address || '',
      tax_number: body.tax_number || `VND-${Math.floor(100000 + Math.random() * 900000)}`,
      category: category || 'General Supplies',
      rating: Number(rating) || 4.8,
      total_orders: 0,
      status: 'Active'
    });

    db.logAudit('VENDOR_REGISTERED', 'Procurement', `Enrolled new supplier: ${name}`);
    return NextResponse.json({ success: true, message: 'Supplier registered', data: newVendor });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, message: 'Vendor ID required' }, { status: 400 });

    const updated = db.update('suppliers', id, updates);
    return NextResponse.json({ success: true, message: 'Supplier updated', data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Vendor ID required' }, { status: 400 });
    db.delete('suppliers', id);
    return NextResponse.json({ success: true, message: 'Supplier deleted' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
