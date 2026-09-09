import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view'); // 'coa', 'gl', 'statements'

    const accounts = db.get('accounts');
    const journalEntries = db.get('journal_entries');

    // 1. Compute Financial Statements
    // Assets
    const assetAccounts = accounts.filter(a => a.type === 'Asset');
    const totalAssets = assetAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    // Liabilities
    const liabilityAccounts = accounts.filter(a => a.type === 'Liability');
    const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    // Equity
    const equityAccounts = accounts.filter(a => a.type === 'Equity');
    const totalEquity = equityAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    // Revenue
    const revenueAccounts = accounts.filter(a => a.type === 'Revenue');
    const totalRevenue = revenueAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    // Expenses
    const expenseAccounts = accounts.filter(a => a.type === 'Expense');
    const totalExpenses = expenseAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    const cogsAccount = accounts.find(a => a.code === '5000');
    const cogs = cogsAccount ? Number(cogsAccount.balance) : 0;
    const grossProfit = totalRevenue - cogs;
    const netIncome = totalRevenue - totalExpenses;

    // Trial Balance items
    const trialBalance = accounts.map(acc => {
      const isDebitNormal = acc.type === 'Asset' || acc.type === 'Expense';
      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: isDebitNormal ? Number(acc.balance) : 0,
        credit: !isDebitNormal ? Number(acc.balance) : 0
      };
    });

    const totalDebits = trialBalance.reduce((sum, item) => sum + item.debit, 0);
    const totalCredits = trialBalance.reduce((sum, item) => sum + item.credit, 0);

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        journalEntries,
        statements: {
          balanceSheet: {
            assets: assetAccounts,
            totalAssets,
            liabilities: liabilityAccounts,
            totalLiabilities,
            equity: equityAccounts,
            totalEquity,
            isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1
          },
          incomeStatement: {
            revenue: revenueAccounts,
            totalRevenue,
            cogs,
            grossProfit,
            expenses: expenseAccounts.filter(a => a.code !== '5000'),
            totalExpenses,
            netIncome
          },
          trialBalance: {
            items: trialBalance,
            totalDebits,
            totalCredits,
            isBalanced: Math.abs(totalDebits - totalCredits) < 1
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

    // 1. New Account Creation
    if (action === 'create-account' || body.code) {
      const { code, name, type, category, balance } = body;
      if (!code || !name || !type) {
        return NextResponse.json({ success: false, message: 'Account code, name, and classification are required' }, { status: 400 });
      }

      const existing = db.get('accounts').find(a => a.code === code);
      if (existing) {
        return NextResponse.json({ success: false, message: `Account code ${code} already exists` }, { status: 409 });
      }

      const newAccount = db.insert('accounts', {
        code,
        name,
        type,
        category: category || `${type}s`,
        balance: Number(balance) || 0,
        is_active: true
      });

      db.logAudit('ACCOUNT_CREATED', 'Accounting', `Created ledger account ${code} - ${name} (${type})`);
      return NextResponse.json({ success: true, message: 'Ledger account initialized', data: newAccount });
    }

    // 2. Post Journal Entry
    if (action === 'post-journal' || body.lines) {
      const { description, reference_number, entry_date, lines } = body;

      if (!lines || !Array.isArray(lines) || lines.length < 2) {
        return NextResponse.json({ success: false, message: 'A journal voucher must have at least 2 lines (debit & credit)' }, { status: 400 });
      }

      let totalDebit = 0;
      let totalCredit = 0;
      lines.forEach(l => {
        totalDebit += Number(l.debit) || 0;
        totalCredit += Number(l.credit) || 0;
      });

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return NextResponse.json({
          success: false,
          message: `Double-entry violation: Total Debits ($${totalDebit.toFixed(2)}) must exactly equal Credits ($${totalCredit.toFixed(2)})`
        }, { status: 400 });
      }

      // Update account balances
      for (const line of lines) {
        const account = db.findById('accounts', line.account_id) || db.get('accounts').find(a => a.code === line.account_code);
        if (account) {
          const isDebitNormal = account.type === 'Asset' || account.type === 'Expense';
          const lineDebit = Number(line.debit) || 0;
          const lineCredit = Number(line.credit) || 0;
          let delta = 0;
          if (isDebitNormal) {
            delta = lineDebit - lineCredit;
          } else {
            delta = lineCredit - lineDebit;
          }
          db.update('accounts', account.id, {
            balance: (Number(account.balance) || 0) + delta
          });
        }
      }

      const entryNumber = `JE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newEntry = db.insert('journal_entries', {
        entry_number: entryNumber,
        entry_date: entry_date || new Date().toISOString().slice(0, 10),
        reference_number: reference_number || `VOUCH-${Date.now().toString().slice(-4)}`,
        description: description || 'Manual Journal Posting',
        total_amount: totalDebit,
        created_by: 'Financial Controller',
        lines
      });

      db.logAudit('JOURNAL_ENTRY_POSTED', 'Accounting', `Posted voucher ${entryNumber} totaling $${totalDebit.toFixed(2)}`);

      return NextResponse.json({
        success: true,
        message: `Journal voucher ${entryNumber} successfully balanced and posted`,
        data: newEntry
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
