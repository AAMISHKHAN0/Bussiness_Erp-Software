import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requirePermission, getClientIp } from '@/lib/auth';
import AccountingEngine from '@/lib/accountingEngine';

export async function GET(request) {
  try {
    const authCheck = await requirePermission(request, 'invoices:view');
    if (!authCheck.authorized) return authCheck.response;

    const { tenant_id } = authCheck.auth;
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('id');

    const invoices = db.get('invoices', tenant_id);
    const customers = db.get('customers', tenant_id);
    const products = db.get('products', tenant_id);
    const payments = db.get('payments', tenant_id);
    const settings = db.getSettings(tenant_id);

    if (invoiceId) {
      const invoice = invoices.find(i => i.id === invoiceId || i.invoice_number === invoiceId);
      if (!invoice) return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 });
      const invoicePayments = payments.filter(p => p.invoice_id === invoice.id);
      return NextResponse.json({ success: true, data: { invoice, payments: invoicePayments } });
    }

    // Auto-synchronize any POS sales missing from invoices ledger
    const posSales = db.get('pos_sales', tenant_id);
    let synced = false;
    for (const pos of posSales) {
      const exists = invoices.some(i => i.sale_id === pos.id || (pos.receipt_number && i.receipt_number === pos.receipt_number));
      if (!exists) {
        const invNum = `INV-${pos.receipt_number ? pos.receipt_number.replace('REC-', 'POS-') : pos.id}`;
        db.insert('invoices', {
          invoice_number: invNum,
          receipt_number: pos.receipt_number,
          order_number: pos.receipt_number,
          sale_id: pos.id,
          customer_id: pos.customer_id || 'cust-walkin',
          customer_name: pos.customer_name || 'Walk-in Retail Client',
          customer_phone: pos.customer_phone || '',
          invoice_date: pos.sale_date ? pos.sale_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
          due_date: pos.sale_date ? pos.sale_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
          items: pos.items || [],
          subtotal: Number(pos.subtotal) || Number(pos.total_amount) || 0,
          discount_amount: Number(pos.discount_amount) || 0,
          tax_amount: Number(pos.tax_amount) || 0,
          total_amount: Number(pos.total_amount) || 0,
          amount_paid: Number(pos.total_amount) || 0,
          balance_due: 0,
          status: pos.status === 'Refunded' ? 'Void' : 'Paid',
          payment_status: pos.status === 'Refunded' ? 'Refunded' : 'Paid',
          payment_method: pos.payment_method || 'Cash',
          terms: 'Settled at POS Terminal',
          notes: `POS Retail Sale Receipt #${pos.receipt_number}`,
          created_by: pos.cashier_name || 'Cashier',
          source: 'POS'
        }, tenant_id);
        synced = true;
      }
    }
    if (synced) {
      db.persist('invoices');
    }

    const allInvoices = db.get('invoices', tenant_id);
    const todayStr = new Date().toISOString().slice(0, 10);

    // Compute live status (auto-flag overdue if not paid and due_date < today)
    const processedInvoices = allInvoices.map(inv => {
      let status = inv.status || 'Issued';
      const balanceDue = Number(inv.balance_due) ?? (Number(inv.total_amount) - (Number(inv.amount_paid) || 0));
      if (status !== 'Paid' && status !== 'Void' && status !== 'Draft') {
        if (balanceDue <= 0) {
          status = 'Paid';
        } else if (inv.due_date && inv.due_date < todayStr) {
          status = 'Overdue';
        }
      }
      return {
        ...inv,
        status,
        balance_due: Math.max(0, balanceDue),
        amount_paid: Number(inv.amount_paid) || (status === 'Paid' ? Number(inv.total_amount) : 0)
      };
    });

    // Summary Metrics
    const totalInvoiced = processedInvoices.filter(i => i.status !== 'Void').reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
    const totalOutstanding = processedInvoices.filter(i => i.status !== 'Paid' && i.status !== 'Void').reduce((s, i) => s + (Number(i.balance_due) || 0), 0);
    const overdueCount = processedInvoices.filter(i => i.status === 'Overdue').length;
    const paidCount = processedInvoices.filter(i => i.status === 'Paid').length;

    return NextResponse.json({
      success: true,
      data: {
        invoices: [...processedInvoices].reverse(),
        customers,
        products,
        payments,
        summary: {
          totalInvoiced,
          totalOutstanding,
          overdueCount,
          paidCount,
          totalCount: processedInvoices.length
        },
        settings
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

    // 1. CREATE INVOICE
    if (!action || action === 'create') {
      const authCheck = await requirePermission(request, 'invoices:create');
      if (!authCheck.authorized) return authCheck.response;

      const { user, tenant_id } = authCheck.auth;
      const { 
        customer_id, 
        items = [], 
        invoice_date = new Date().toISOString().slice(0, 10),
        due_date,
        discount_amount = 0,
        tax_amount = 0,
        notes = '',
        terms = 'Payment due within 30 days from date of issuance.',
        status = 'Issued',
        payment_method = 'Bank Transfer'
      } = body;

      let customer = db.findById('customers', customer_id, tenant_id);
      if (!customer) {
        if (customer_id === 'cust-walkin' || !customer_id) {
          customer = {
            id: 'cust-walkin',
            name: body.customer_name || 'Walk-in Retail Customer',
            email: '',
            phone: ''
          };
        } else {
          customer = {
            id: customer_id,
            name: body.customer_name || 'Commercial Client',
            email: '',
            phone: ''
          };
        }
      }

      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, message: 'Invoice requires at least one item or service.' }, { status: 400 });
      }

      let subtotal = 0;
      const processedItems = items.map(item => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unit_price) || 0;
        const total = qty * price;
        subtotal += total;
        return {
          product_id: item.product_id || null,
          name: item.name || 'Commercial Service Item',
          sku: item.sku || 'SRV-01',
          quantity: qty,
          unit_price: price,
          total
        };
      });

      const taxable = Math.max(0, subtotal - Number(discount_amount));
      const calculatedTax = Number(tax_amount) > 0 ? Number(tax_amount) : Math.round(taxable * 0.18 * 100) / 100;
      const grandTotal = Math.round((taxable + calculatedTax) * 100) / 100;

      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const calculatedDueDate = due_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      const isPaid = status === 'Paid';

      const newInvoice = db.insert('invoices', {
        invoice_number: invoiceNumber,
        customer_id: customer.id,
        customer_name: customer.name || customer.company_name,
        customer_email: customer.email || '',
        customer_phone: customer.phone || '',
        invoice_date,
        due_date: calculatedDueDate,
        items: processedItems,
        subtotal,
        discount_amount: Number(discount_amount),
        tax_amount: calculatedTax,
        total_amount: grandTotal,
        amount_paid: isPaid ? grandTotal : 0,
        balance_due: isPaid ? 0 : grandTotal,
        status: status || 'Issued',
        payment_status: isPaid ? 'Paid' : 'Unpaid',
        payment_method,
        terms,
        notes,
        created_by: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
      }, tenant_id);

      db.persist('invoices');

      // If issued on credit, adjust customer accounts receivable balance
      if (newInvoice.status === 'Issued' && customer.id !== 'cust-walkin') {
        db.update('customers', customer.id, {
          current_balance: Math.round(((Number(customer.current_balance) || 0) + grandTotal) * 100) / 100
        }, tenant_id);
      } else if (newInvoice.status === 'Paid' && customer.id !== 'cust-walkin') {
        db.update('customers', customer.id, {
          total_spent: Math.round(((Number(customer.total_spent) || 0) + grandTotal) * 100) / 100
        }, tenant_id);
      }

      db.logAudit(
        'INVOICE_CREATED',
        'Invoices',
        `Created invoice ${invoiceNumber} for ${customer.name} (PKR ${grandTotal.toLocaleString()}) with status ${newInvoice.status}`,
        user,
        clientIp
      );

      return NextResponse.json({
        success: true,
        message: `Commercial Invoice ${invoiceNumber} generated successfully.`,
        data: newInvoice
      });
    }

    // 2. ISSUE DRAFT INVOICE
    if (action === 'issue') {
      const authCheck = await requirePermission(request, 'invoices:issue');
      if (!authCheck.authorized) return authCheck.response;

      const { user, tenant_id } = authCheck.auth;
      const { invoice_id } = body;

      const invoice = db.findById('invoices', invoice_id, tenant_id);
      if (!invoice) return NextResponse.json({ success: false, message: 'Invoice not found.' }, { status: 404 });

      if (invoice.status !== 'Draft') {
        return NextResponse.json({ success: false, message: 'Only Draft invoices can be issued.' }, { status: 400 });
      }

      db.update('invoices', invoice.id, { status: 'Issued' }, tenant_id);

      // Increase customer AR balance
      const customer = db.findById('customers', invoice.customer_id, tenant_id);
      if (customer) {
        db.update('customers', customer.id, {
          current_balance: Math.round(((Number(customer.current_balance) || 0) + Number(invoice.total_amount)) * 100) / 100
        }, tenant_id);
      }

      db.logAudit('INVOICE_ISSUED', 'Invoices', `Issued invoice ${invoice.invoice_number} to customer`, user, clientIp);
      return NextResponse.json({ success: true, message: `Invoice ${invoice.invoice_number} has been officially issued.` });
    }

    // 3. RECORD PAYMENT AGAINST INVOICE
    if (action === 'record-payment') {
      const authCheck = await requirePermission(request, 'invoices:record_payment');
      if (!authCheck.authorized) return authCheck.response;

      const { user, tenant_id } = authCheck.auth;
      const { 
        invoice_id, 
        amount = 0, 
        payment_method = 'Bank Transfer', 
        payment_date = new Date().toISOString().slice(0, 10),
        reference = '' 
      } = body;

      const invoice = db.findById('invoices', invoice_id, tenant_id);
      if (!invoice) return NextResponse.json({ success: false, message: 'Invoice not found.' }, { status: 404 });

      const payAmount = Number(amount);
      if (payAmount <= 0) {
        return NextResponse.json({ success: false, message: 'Payment amount must be greater than zero.' }, { status: 400 });
      }

      const currentBalance = Number(invoice.balance_due) ?? (Number(invoice.total_amount) - (Number(invoice.amount_paid) || 0));
      const newPaid = Math.round(((Number(invoice.amount_paid) || 0) + payAmount) * 100) / 100;
      const newBalance = Math.max(0, Math.round((currentBalance - payAmount) * 100) / 100);
      const newStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid';

      // Insert Payment
      const paymentNumber = `PAY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const paymentRecord = db.insert('payments', {
        payment_number: paymentNumber,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name,
        amount: payAmount,
        payment_date,
        payment_method,
        reference: reference || `Settlement for ${invoice.invoice_number}`,
        status: 'Cleared',
        recorded_by: user.email
      }, tenant_id);

      // Update Invoice
      db.update('invoices', invoice.id, {
        amount_paid: newPaid,
        balance_due: newBalance,
        status: newStatus,
        payment_status: newStatus === 'Paid' ? 'Paid' : 'Partially Paid'
      }, tenant_id);

      // Deduct from customer current receivable balance
      const customer = db.findById('customers', invoice.customer_id, tenant_id);
      if (customer) {
        db.update('customers', customer.id, {
          current_balance: Math.max(0, Math.round(((Number(customer.current_balance) || 0) - payAmount) * 100) / 100),
          total_spent: Math.round(((Number(customer.total_spent) || 0) + payAmount) * 100) / 100
        }, tenant_id);
      }

      // Automated GAAP Double-Entry Posting:
      // Dr Cash/Bank (#1010 or #1020), Cr Accounts Receivable (#1100)
      let accountingVoucher = null;
      try {
        accountingVoucher = AccountingEngine.postInvoicePayment(invoice, paymentRecord, user, tenant_id);
      } catch (accErr) {
        console.warn('[Invoice API] Payment accounting posting notice:', accErr.message);
      }

      db.logAudit(
        'INVOICE_PAYMENT_RECORDED',
        'Invoices',
        `Recorded payment ${paymentNumber} of PKR ${payAmount.toLocaleString()} against invoice ${invoice.invoice_number}`,
        user,
        clientIp
      );

      return NextResponse.json({
        success: true,
        message: `Payment of PKR ${payAmount.toLocaleString()} recorded. Invoice status: ${newStatus}`,
        data: {
          payment: paymentRecord,
          voucher: accountingVoucher
        }
      });
    }

    // 4. VOID INVOICE
    if (action === 'void') {
      const authCheck = await requirePermission(request, 'invoices:void');
      if (!authCheck.authorized) return authCheck.response;

      const { user, tenant_id } = authCheck.auth;
      const { invoice_id, reason = 'Invoice Cancelled / Voided' } = body;

      const invoice = db.findById('invoices', invoice_id, tenant_id);
      if (!invoice) return NextResponse.json({ success: false, message: 'Invoice not found.' }, { status: 404 });

      if (invoice.status === 'Void') {
        return NextResponse.json({ success: false, message: 'Invoice is already voided.' }, { status: 400 });
      }

      // If it was Issued or Partially Paid, reverse remaining uncollected customer balance
      const uncollected = Number(invoice.balance_due) || 0;
      if (uncollected > 0 && invoice.status !== 'Draft') {
        const customer = db.findById('customers', invoice.customer_id, tenant_id);
        if (customer) {
          db.update('customers', customer.id, {
            current_balance: Math.max(0, Math.round(((Number(customer.current_balance) || 0) - uncollected) * 100) / 100)
          }, tenant_id);
        }
      }

      db.update('invoices', invoice.id, {
        status: 'Void',
        voided_at: new Date().toISOString(),
        void_reason: reason,
        voided_by: user.email
      }, tenant_id);

      db.logAudit('INVOICE_VOIDED', 'Invoices', `Voided invoice ${invoice.invoice_number}: ${reason}`, user, clientIp);

      return NextResponse.json({
        success: true,
        message: `Invoice ${invoice.invoice_number} has been voided.`
      });
    }

    return NextResponse.json({ success: false, message: 'Unknown invoice action.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
