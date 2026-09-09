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
    const view = searchParams.get('view'); // 'coa', 'gl', 'statements'
    const accountCode = searchParams.get('account_code');

    const accounts = db.get('accounts', tenant_id);
    const journalEntries = db.get('journal_entries', tenant_id);

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

    // General Ledger View if specific account requested
    let generalLedger = null;
    if (accountCode) {
      const glLines = [];
      for (const je of journalEntries) {
        if (Array.isArray(je.lines)) {
          for (const l of je.lines) {
            if (String(l.account_code) === String(accountCode) || String(l.account_id) === String(accountCode)) {
              glLines.push({
                entry_number: je.entry_number,
                entry_date: je.entry_date,
                reference_number: je.reference_number,
                reference_type: je.reference_type,
                description: je.description,
                debit: l.debit,
                credit: l.credit
              });
            }
          }
        }
      }
      generalLedger = glLines;
    }

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        journalEntries: journalEntries.slice(0, 100),
        generalLedger,
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

    // 1. New Ledger Account Creation
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

    // 2. Reverse Transaction Flow
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

    // 3. Post Balanced Journal Voucher Flow
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
