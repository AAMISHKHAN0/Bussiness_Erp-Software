import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requirePermission, getClientIp } from '@/lib/auth';
import AccountingEngine from '@/lib/accountingEngine';

export async function GET(request) {
  try {
    const authCheck = await requirePermission(request, 'accounting:view');
    if (!authCheck.authorized) return authCheck.response;

    const { tenant_id } = authCheck.auth;
    const { searchParams } = new URL(request.url);
    const accountCode = searchParams.get('account_code');

    const accounts = db.get('accounts', tenant_id);
    const journalEntries = db.get('journal_entries', tenant_id);
    const expenses = db.get('expenses', tenant_id);
    const invoices = db.get('invoices', tenant_id);
    const payments = db.get('payments', tenant_id);
    const posSales = db.get('pos_sales', tenant_id);
    const customers = db.get('customers', tenant_id);
    const suppliers = db.get('suppliers', tenant_id);
    const purchaseOrders = db.get('purchase_orders', tenant_id);
    const posRegisters = db.get('pos_registers', tenant_id);

    // 1. Compute Financial Statements
    // Assets (Normal Debit Balance)
    const assetAccounts = accounts.filter(a => a.type === 'Asset');
    const totalAssets = Math.round(assetAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0) * 100) / 100;

    // Liabilities (Normal Credit Balance)
    const liabilityAccounts = accounts.filter(a => a.type === 'Liability');
    const totalLiabilities = Math.round(liabilityAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0) * 100) / 100;

    // Equity (Normal Credit Balance)
    const equityAccounts = accounts.filter(a => a.type === 'Equity');
    const totalEquity = Math.round(equityAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0) * 100) / 100;

    // Revenue (Normal Credit Balance)
    const revenueAccounts = accounts.filter(a => a.type === 'Revenue');
    const totalRevenue = Math.round(revenueAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0) * 100) / 100;

    // Expenses (Normal Debit Balance)
    const expenseAccounts = accounts.filter(a => a.type === 'Expense');
    const totalExpenses = Math.round(expenseAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0) * 100) / 100;

    // COGS
    const cogsAccount = accounts.find(a => a.code === '5010' || a.code === '5000' || a.name.toLowerCase().includes('cogs'));
    const cogs = cogsAccount ? Number(cogsAccount.balance) || 0 : 0;
    const grossProfit = Math.round((totalRevenue - cogs) * 100) / 100;
    const netIncome = Math.round((totalRevenue - totalExpenses) * 100) / 100;

    // Total Equity with Current Period Retained Net Income
    const totalEquityWithNetIncome = Math.round((totalEquity + netIncome) * 100) / 100;
    const isBalanceSheetBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquityWithNetIncome)) < 1.00;

    // Trial Balance items
    const trialBalance = accounts.map(acc => {
      const isDebitNormal = acc.type === 'Asset' || acc.type === 'Expense';
      const bal = Number(acc.balance) || 0;
      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: isDebitNormal ? (bal >= 0 ? bal : 0) : (bal < 0 ? Math.abs(bal) : 0),
        credit: !isDebitNormal ? (bal >= 0 ? bal : 0) : (bal < 0 ? Math.abs(bal) : 0)
      };
    });

    const totalDebits = Math.round(trialBalance.reduce((sum, item) => sum + item.debit, 0) * 100) / 100;
    const totalCredits = Math.round(trialBalance.reduce((sum, item) => sum + item.credit, 0) * 100) / 100;

    // Cash & Bank Position
    const cashBankAccounts = accounts.filter(a => 
      a.type === 'Asset' && (a.code.startsWith('10') || a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('cash'))
    );
    const totalCashBank = Math.round(cashBankAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0) * 100) / 100;

    // Accounts Receivable
    const totalAR = customers.reduce((sum, c) => sum + (Number(c.current_balance) || 0), 0);
    const unpaidInvoices = invoices.filter(i => i.status !== 'Paid' && i.status !== 'Void');

    // Accounts Payable
    const pendingPOs = purchaseOrders.filter(p => p.status !== 'Cancelled' && p.payment_status !== 'Paid');
    const totalAP = accounts.find(a => a.code === '2010')?.balance || pendingPOs.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);

    // Consolidated Chronological Transactions Stream
    const unifiedTransactions = [];

    // 1. Journal Vouchers
    for (const je of journalEntries) {
      unifiedTransactions.push({
        id: je.id,
        type: je.reference_type || 'JOURNAL_VOUCHER',
        reference: je.entry_number,
        date: je.entry_date,
        description: je.description,
        amount: Number(je.total_amount) || 0,
        source: 'General Ledger',
        status: 'Posted',
        badgeColor: 'blue'
      });
    }

    // 2. POS Sales
    for (const pos of posSales) {
      unifiedTransactions.push({
        id: pos.id,
        type: 'POS_SALE',
        reference: pos.receipt_number,
        date: pos.sale_date ? pos.sale_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        description: `POS Retail Sale (${pos.customer_name || 'Walk-in'})`,
        amount: Number(pos.total_amount) || 0,
        source: 'Point of Sale',
        status: pos.status || 'Completed',
        badgeColor: 'emerald'
      });
    }

    // 3. Corporate Expenses
    for (const exp of expenses) {
      unifiedTransactions.push({
        id: exp.id,
        type: 'EXPENSE',
        reference: exp.expense_number,
        date: exp.date,
        description: `${exp.category}: ${exp.description || exp.payee_vendor}`,
        amount: Number(exp.amount) || 0,
        source: 'Disbursements',
        status: exp.status || 'Settled',
        badgeColor: 'rose'
      });
    }

    // 4. Invoices
    for (const inv of invoices) {
      unifiedTransactions.push({
        id: inv.id,
        type: 'INVOICE',
        reference: inv.invoice_number,
        date: inv.invoice_date,
        description: `Commercial Invoice for ${inv.customer_name}`,
        amount: Number(inv.total_amount) || 0,
        source: 'Commercial Billing',
        status: inv.status || 'Issued',
        badgeColor: 'indigo'
      });
    }

    // 5. Payments Received
    for (const pay of payments) {
      unifiedTransactions.push({
        id: pay.id,
        type: 'PAYMENT_RECEIVED',
        reference: pay.payment_number,
        date: pay.payment_date,
        description: `Receipt from ${pay.customer_name} via ${pay.payment_method || 'Electronic Settlement'}`,
        amount: Number(pay.amount) || 0,
        source: 'Cash & Bank',
        status: pay.status || 'Cleared',
        badgeColor: 'teal'
      });
    }

    // Sort descending by date
    unifiedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // General Ledger Account Lines with Running Balance
    const accountLedgers = {};
    for (const acc of accounts) {
      let runningBalance = 0;
      const isDebitNormal = acc.type === 'Asset' || acc.type === 'Expense';
      const lines = [];

      for (const je of journalEntries) {
        if (Array.isArray(je.lines)) {
          for (const l of je.lines) {
            if (String(l.account_code) === String(acc.code) || String(l.account_id) === String(acc.id)) {
              const debit = Number(l.debit) || 0;
              const credit = Number(l.credit) || 0;
              const delta = isDebitNormal ? (debit - credit) : (credit - debit);
              runningBalance = Math.round((runningBalance + delta) * 100) / 100;

              lines.push({
                entry_number: je.entry_number,
                date: je.entry_date,
                reference: je.reference_number,
                description: je.description,
                debit,
                credit,
                balance: runningBalance
              });
            }
          }
        }
      }
      accountLedgers[acc.code] = lines;
    }

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        journalEntries: journalEntries.slice(0, 100),
        expenses,
        invoices,
        posSales,
        transactions: unifiedTransactions.slice(0, 150),
        accountLedgers,
        cashAndBank: {
          accounts: cashBankAccounts,
          total: totalCashBank,
          registers: posRegisters
        },
        receivables: {
          total: totalAR,
          customers: customers.filter(c => Number(c.current_balance) > 0),
          unpaidInvoices
        },
        payables: {
          total: totalAP,
          pendingPOs,
          suppliers
        },
        statements: {
          balanceSheet: {
            assets: assetAccounts,
            totalAssets,
            liabilities: liabilityAccounts,
            totalLiabilities,
            equity: equityAccounts,
            totalEquity,
            netIncomeRetained: netIncome,
            totalEquityWithNetIncome,
            isBalanced: isBalanceSheetBalanced
          },
          incomeStatement: {
            revenue: revenueAccounts,
            totalRevenue,
            cogs,
            grossProfit,
            expenses: expenseAccounts.filter(a => a.code !== '5010' && a.code !== '5000'),
            totalExpenses,
            netIncome
          },
          trialBalance: {
            items: trialBalance,
            totalDebits,
            totalCredits,
            isBalanced: Math.abs(totalDebits - totalCredits) < 1.00
          }
        }
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

    // 1. Create Corporate Expense with Automated Double-Entry Voucher
    if (action === 'create-expense') {
      const authCheck = await requirePermission(request, 'accounting:expense');
      if (!authCheck.authorized) return authCheck.response;
      const { user, tenant_id } = authCheck.auth;

      const { category, account_id, payment_account_id, amount, payee_vendor, payment_method, reference_number, description, date } = body;

      const numAmount = Math.round((Number(amount) || 0) * 100) / 100;
      if (numAmount <= 0) {
        return NextResponse.json({ success: false, message: 'A positive expense amount is required.' }, { status: 400 });
      }

      const expenseNumber = `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newExpense = db.insert('expenses', {
        expense_number: expenseNumber,
        category: category || 'Operating Expense',
        account_id: account_id || 'acc-6020',
        payment_account_id: payment_account_id || 'acc-1010',
        amount: numAmount,
        payee_vendor: payee_vendor || 'Corporate Vendor',
        payment_method: payment_method || 'Bank Transfer',
        reference_number: reference_number || expenseNumber,
        description: description || 'Corporate operational expenditure',
        date: date || new Date().toISOString().slice(0, 10),
        status: 'Settled',
        created_by: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
      }, tenant_id);

      // Automated GAAP Double-Entry: Dr Expense Account, Cr Cash/Bank or AP
      let voucher = null;
      try {
        voucher = AccountingEngine.postExpense(newExpense, user, tenant_id);
      } catch (e) {
        console.warn('[Accounting API] Expense posting notice:', e.message);
      }

      db.logAudit(
        'EXPENSE_RECORDED',
        'Accounting',
        `Recorded corporate expense ${expenseNumber} (${payee_vendor}) totaling Rs. ${numAmount.toLocaleString()}`,
        user,
        clientIp
      );

      return NextResponse.json({
        success: true,
        message: `Expense ${expenseNumber} recorded and posted to General Ledger.`,
        data: { expense: newExpense, voucher }
      });
    }

    // 2. New Ledger Account Creation
    if (action === 'create-account' || body.code) {
      const authCheck = await requirePermission(request, 'accounting:create');
      if (!authCheck.authorized) return authCheck.response;
      const { user, tenant_id } = authCheck.auth;

      const { code, name, type, category, balance } = body;
      if (!code || !name || !type) {
        return NextResponse.json({ success: false, message: 'Account code, name, and classification are required' }, { status: 400 });
      }

      const existing = db.get('accounts', tenant_id).find(a => a.code === code);
      if (existing) {
        return NextResponse.json({ success: false, message: `Account code ${code} already exists in chart of accounts` }, { status: 409 });
      }

      const newAccount = db.insert('accounts', {
        code,
        name,
        type,
        category: category || `${type}s`,
        balance: Number(balance) || 0,
        is_active: true
      }, tenant_id);

      db.logAudit('ACCOUNT_CREATED', 'Accounting', `Created ledger account ${code} - ${name} (${type})`, user, clientIp);
      return NextResponse.json({ success: true, message: 'Ledger account initialized', data: newAccount });
    }

    // 3. Reverse Transaction Flow
    if (action === 'reverse') {
      const authCheck = await requirePermission(request, 'accounting:reverse');
      if (!authCheck.authorized) return authCheck.response;
      const { user, tenant_id } = authCheck.auth;

      const { reference_number, reason } = body;
      if (!reference_number) {
        return NextResponse.json({ success: false, message: 'Reference number is required for transaction reversal' }, { status: 400 });
      }

      const reversal = AccountingEngine.reverseTransaction(reference_number, reason, user, tenant_id);
      if (!reversal) {
        return NextResponse.json({ success: false, message: `Original voucher for ${reference_number} not found` }, { status: 404 });
      }

      db.logAudit('TRANSACTION_REVERSED', 'Accounting', `Reversed voucher for ${reference_number}: ${reason}`, user, clientIp);
      return NextResponse.json({ success: true, message: `Voucher ${reference_number} reversed successfully`, data: reversal });
    }

    // 4. Post Balanced Journal Voucher Flow
    if (action === 'post-journal' || body.lines) {
      const authCheck = await requirePermission(request, 'accounting:post');
      if (!authCheck.authorized) return authCheck.response;
      const { user, tenant_id } = authCheck.auth;

      const { description, reference_number, entry_date, lines } = body;

      const newVoucher = AccountingEngine.postVoucher({
        entryDate: entry_date || new Date().toISOString().slice(0, 10),
        referenceNumber: reference_number || `JE-MAN-${Date.now().toString().slice(-4)}`,
        referenceType: 'MANUAL',
        description: description || 'Manual General Journal Posting',
        lines,
        user,
        tenantId: tenant_id
      });

      return NextResponse.json({
        success: true,
        message: `Journal voucher ${newVoucher.entry_number} balanced and posted to general ledger`,
        data: newVoucher
      });
    }

    return NextResponse.json({ success: false, message: 'Unrecognized accounting action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
