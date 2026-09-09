import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const customers = db.get('customers');
  return NextResponse.json({ success: true, data: customers });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, company_name, email, phone, address, credit_limit } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Name and email are required' }, { status: 400 });
    }

    const newCustomer = db.insert('customers', {
      name,
      company_name: company_name || name,
      contact_person: body.contact_person || name,
      email,
      phone: phone || '',
      address: address || '',
      tax_number: body.tax_number || `US-TX-${Math.floor(100000 + Math.random() * 900000)}`,
      credit_limit: Number(credit_limit) || 25000,
      total_spent: 0,
      current_balance: 0,
      status: 'Active'
    });

    db.logAudit('CUSTOMER_CREATED', 'CRM', `Added customer account for ${name} (${company_name || 'Individual'})`);
    return NextResponse.json({ success: true, message: 'Customer added successfully', data: newCustomer });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, message: 'Customer ID required' }, { status: 400 });

    const updated = db.update('customers', id, updates);
    return NextResponse.json({ success: true, message: 'Customer updated', data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Customer ID required' }, { status: 400 });
    db.delete('customers', id);
    return NextResponse.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
