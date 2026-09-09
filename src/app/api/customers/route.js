import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requirePermission, getClientIp } from '@/lib/auth';

export async function GET(request) {
  try {
    const authCheck = await requirePermission(request, 'customers:view');
    if (!authCheck.authorized) return authCheck.response;

    const { tenant_id } = authCheck.auth;
    const customers = db.get('customers', tenant_id);
    return NextResponse.json({ success: true, data: customers });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authCheck = await requirePermission(request, 'customers:create');
    if (!authCheck.authorized) return authCheck.response;
    const { user, tenant_id } = authCheck.auth;
    const clientIp = getClientIp(request);

    const body = await request.json();
    const { name, company_name, email, phone, address, credit_limit } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Name and email are required' }, { status: 400 });
    }

    const existing = db.get('customers', tenant_id).find(c => c.email?.toLowerCase() === email.toLowerCase());
    if (existing) {
      return NextResponse.json({ success: false, message: `Customer with email ${email} already exists` }, { status: 409 });
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
    }, tenant_id);

    db.logAudit('CUSTOMER_CREATED', 'CRM', `Added customer account for ${name} (${company_name || 'Individual'})`, user, clientIp);
    return NextResponse.json({ success: true, message: 'Customer added successfully', data: newCustomer });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const authCheck = await requirePermission(request, 'customers:edit');
    if (!authCheck.authorized) return authCheck.response;
    const { user, tenant_id } = authCheck.auth;
    const clientIp = getClientIp(request);

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, message: 'Customer ID required' }, { status: 400 });

    const customer = db.findById('customers', id, tenant_id);
    if (!customer) return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });

    const updated = db.update('customers', id, updates, tenant_id);
    db.logAudit('CUSTOMER_UPDATED', 'CRM', `Updated customer ${customer.name}`, user, clientIp);
    return NextResponse.json({ success: true, message: 'Customer profile updated', data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const authCheck = await requirePermission(request, 'customers:delete');
    if (!authCheck.authorized) return authCheck.response;
    const { user, tenant_id } = authCheck.auth;
    const clientIp = getClientIp(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Customer ID required' }, { status: 400 });

    const customer = db.findById('customers', id, tenant_id);
    if (!customer) return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });

    // Protect against deleting customers with outstanding receivables balance
    if (Number(customer.current_balance) > 0) {
      return NextResponse.json({
        success: false,
        message: `Cannot delete customer with outstanding AR balance ($${Number(customer.current_balance).toLocaleString()}). Settle open invoices first.`
      }, { status: 400 });
    }

    db.delete('customers', id, tenant_id);
    db.logAudit('CUSTOMER_DELETED', 'CRM', `Deleted customer record for ${customer.name}`, user, clientIp);
    return NextResponse.json({ success: true, message: 'Customer removed' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
