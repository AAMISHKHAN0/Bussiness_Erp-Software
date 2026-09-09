import db from './db';

/**
 * Enterprise Double-Entry Accounting Engine
 * Enforces GAAP compliance across all operational ERP modules.
 * Automatically posts balanced Journal Vouchers (Debits === Credits)
 * and mutates Chart of Accounts ledger balances.
 */
export class AccountingEngine {
  /**
   * Helper to find or fallback to ledger account
   */
  static getAccount(code, tenantId = 'tenant-default') {
    const accounts = db.get('accounts', tenantId);
    return accounts.find(a => String(a.code) === String(code)) || null;
  }

  /**
   * Post balanced double-entry journal voucher and update account balances
   */
  static postVoucher({
    entryDate,
    referenceNumber,
    referenceType,
    description,
    lines,
    user = 'System Auto-Posting',
    tenantId = 'tenant-default'
  }) {
    if (!Array.isArray(lines) || lines.length < 2) {
      throw new Error('Double-entry violation: A journal entry must have at least 2 lines (debit & credit).');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    const validatedLines = lines.map(line => {
      const debit = Math.round((Number(line.debit) || 0) * 100) / 100;
      const credit = Math.round((Number(line.credit) || 0) * 100) / 100;
      totalDebit += debit;
      totalCredit += credit;

      return {
        account_id: line.account_id,
        account_code: line.account_code,
        account_name: line.account_name,
        debit,
        credit
      };
    });

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `GAAP Imbalance: Total Debits ($${totalDebit.toFixed(2)}) must equal Total Credits ($${totalCredit.toFixed(2)}). Difference: $${Math.abs(totalDebit - totalCredit).toFixed(2)}`
      );
    }

    // Mutate ledger account balances
    for (const line of validatedLines) {
      let account = null;
      if (line.account_id) {
        account = db.findById('accounts', line.account_id, tenantId);
      }
      if (!account && line.account_code) {
        account = this.getAccount(line.account_code, tenantId);
      }

      if (account) {
        const isDebitNormal = account.type === 'Asset' || account.type === 'Expense';
        const delta = isDebitNormal ? (line.debit - line.credit) : (line.credit - line.debit);
        const newBalance = Math.round(((Number(account.balance) || 0) + delta) * 100) / 100;
        
        db.update('accounts', account.id, { balance: newBalance }, tenantId);
      }
    }

    const entryNumber = `JE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newVoucher = db.insert('journal_entries', {
      entry_number: entryNumber,
      entry_date: entryDate || new Date().toISOString().slice(0, 10),
      reference_number: referenceNumber || entryNumber,
      reference_type: referenceType || 'MANUAL',
      description,
      total_amount: totalDebit,
      created_by: typeof user === 'object' ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : user,
      is_system_generated: true,
      lines: validatedLines
    }, tenantId);

    db.logAudit(
      'JOURNAL_POSTING',
      'Accounting',
      `Posted double-entry voucher ${entryNumber} (${referenceType || 'GEN'} ${referenceNumber}) totaling $${totalDebit.toLocaleString()}`,
      user
    );

    return newVoucher;
  }

  /**
   * Automated Sales Invoicing Double-Entry Posting
   * Debits AR (or Cash), Credits Sales Revenue, Credits Tax Payable,
   * Debits COGS, Credits Merchandise Inventory.
   */
  static postSalesOrder(order, user, tenantId = 'tenant-default') {
    const netAmount = Number(order.net_amount) || Number(order.total_amount) || 0;
    const taxAmount = Number(order.tax_amount) || 0;
    const discountAmount = Number(order.discount_amount) || 0;
    const grossSales = Math.round((netAmount - taxAmount) * 100) / 100;

    // Calculate actual cost of goods sold from line items
    let cogsAmount = 0;
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const product = db.findById('products', item.product_id, tenantId);
        const unitCost = product ? (Number(product.purchase_price) || 0) : (Number(item.unit_price) * 0.6);
        cogsAmount += (Number(item.quantity) || 1) * unitCost;
      }
    }
    cogsAmount = Math.round(cogsAmount * 100) / 100;

    const accReceivable = this.getAccount('1100', tenantId) || { id: 'acc-1100', code: '1100', name: 'Accounts Receivable' };
    const accCash = this.getAccount('1010', tenantId) || { id: 'acc-1010', code: '1010', name: 'Operating Checking Account (Chase)' };
    const accRevenue = this.getAccount('4010', tenantId) || { id: 'acc-4010', code: '4010', name: 'Commercial Hardware Sales Revenue' };
    const accTax = this.getAccount('2100', tenantId) || { id: 'acc-2100', code: '2100', name: 'Accrued Statutory Liabilities & Tax' };
    const accCOGS = this.getAccount('5010', tenantId) || { id: 'acc-5010', code: '5010', name: 'Cost of Goods Sold (COGS)' };
    const accInventory = this.getAccount('1200', tenantId) || { id: 'acc-1200', code: '1200', name: 'Finished Goods Merchandise Inventory' };

    const isPaid = order.payment_status === 'Paid';
    const lines = [];

    // 1. Revenue recognition lines
    lines.push({
      account_id: isPaid ? accCash.id : accReceivable.id,
      account_code: isPaid ? accCash.code : accReceivable.code,
      account_name: isPaid ? accCash.name : accReceivable.name,
      debit: netAmount,
      credit: 0
    });

    if (taxAmount > 0) {
      lines.push({
        account_id: accRevenue.id,
        account_code: accRevenue.code,
        account_name: accRevenue.name,
        debit: 0,
        credit: grossSales
      });
      lines.push({
        account_id: accTax.id,
        account_code: accTax.code,
        account_name: accTax.name,
        debit: 0,
        credit: taxAmount
      });
    } else {
      lines.push({
        account_id: accRevenue.id,
        account_code: accRevenue.code,
        account_name: accRevenue.name,
        debit: 0,
        credit: netAmount
      });
    }

    // 2. Inventory capitalization reduction lines
    if (cogsAmount > 0) {
      lines.push({
        account_id: accCOGS.id,
        account_code: accCOGS.code,
        account_name: accCOGS.name,
        debit: cogsAmount,
        credit: 0
      });
      lines.push({
        account_id: accInventory.id,
        account_code: accInventory.code,
        account_name: accInventory.name,
        debit: 0,
        credit: cogsAmount
      });
    }

    return this.postVoucher({
      entryDate: order.order_date || new Date().toISOString().slice(0, 10),
      referenceNumber: order.order_number,
      referenceType: 'SALES_ORDER',
      description: `Revenue & COGS recognition for Order ${order.order_number} (${order.customer_name})`,
      lines,
      user,
      tenantId
    });
  }

  /**
   * Automated Goods Receipt (GRN) Double-Entry Posting
   * Debits Merchandise Inventory (#1200), Credits Accounts Payable (#2010).
   */
  static postGoodsReceipt(po, user, tenantId = 'tenant-default') {
    const totalAmount = Math.round((Number(po.total_amount) || 0) * 100) / 100;
    if (totalAmount <= 0) return null;

    const accInventory = this.getAccount('1200', tenantId) || { id: 'acc-1200', code: '1200', name: 'Finished Goods Merchandise Inventory' };
    const accPayable = this.getAccount('2010', tenantId) || { id: 'acc-2010', code: '2010', name: 'Accounts Payable' };

    const lines = [
      {
        account_id: accInventory.id,
        account_code: accInventory.code,
        account_name: accInventory.name,
        debit: totalAmount,
        credit: 0
      },
      {
        account_id: accPayable.id,
        account_code: accPayable.code,
        account_name: accPayable.name,
        debit: 0,
        credit: totalAmount
      }
    ];

    return this.postVoucher({
      entryDate: new Date().toISOString().slice(0, 10),
      referenceNumber: po.order_number,
      referenceType: 'GOODS_RECEIPT',
      description: `Inventory capitalization for PO ${po.order_number} from ${po.supplier_name}`,
      lines,
      user,
      tenantId
    });
  }

  /**
   * Automated Payroll Disbursement Double-Entry Posting
   * Debits Staff Salaries (#6010), Credits Payroll Clearing (#1020),
   * Credits Tax/Benefits Withholdings (#2100).
   */
  static postPayrollDisbursement(payroll, user, tenantId = 'tenant-default') {
    const gross = Math.round((Number(payroll.total_gross) || 0) * 100) / 100;
    const net = Math.round((Number(payroll.total_net) || 0) * 100) / 100;
    const deductions = Math.round((Number(payroll.total_deductions) || 0) * 100) / 100;

    const accSalaries = this.getAccount('6010', tenantId) || { id: 'acc-6010', code: '6010', name: 'Staff Salaries & Executive Compensation' };
    const accClearing = this.getAccount('1020', tenantId) || { id: 'acc-1020', code: '1020', name: 'Payroll Clearing Account' };
    const accWithholding = this.getAccount('2100', tenantId) || { id: 'acc-2100', code: '2100', name: 'Accrued Payroll & Statutory Liabilities' };

    const lines = [
      {
        account_id: accSalaries.id,
        account_code: accSalaries.code,
        account_name: accSalaries.name,
        debit: gross,
        credit: 0
      },
      {
        account_id: accClearing.id,
        account_code: accClearing.code,
        account_name: accClearing.name,
        debit: 0,
        credit: net
      },
      {
        account_id: accWithholding.id,
        account_code: accWithholding.code,
        account_name: accWithholding.name,
        debit: 0,
        credit: deductions
      }
    ];

    return this.postVoucher({
      entryDate: payroll.payment_date || new Date().toISOString().slice(0, 10),
      referenceNumber: payroll.id,
      referenceType: 'PAYROLL',
      description: `Payroll disbursement for ${payroll.month} ${payroll.year}`,
      lines,
      user,
      tenantId
    });
  }

  /**
   * Safe Reversal of Transaction
   * Creates an exact mirror reversing journal entry (swapping Debits and Credits)
   * so previous accounting records are never destructively erased.
   */
  static reverseTransaction(referenceNumber, reason, user, tenantId = 'tenant-default') {
    const journalEntries = db.get('journal_entries', tenantId);
    const originalEntry = journalEntries.find(je => je.reference_number === referenceNumber);
    if (!originalEntry) return null;

    // Invert lines: debits become credits, credits become debits
    const invertedLines = originalEntry.lines.map(line => ({
      ...line,
      debit: line.credit,
      credit: line.debit
    }));

    return this.postVoucher({
      entryDate: new Date().toISOString().slice(0, 10),
      referenceNumber: `REV-${referenceNumber}`,
      referenceType: 'REVERSAL',
      description: `Reversal of ${referenceNumber}: ${reason || 'Transaction cancelled'}`,
      lines: invertedLines,
      user,
      tenantId
    });
  }
}

export default AccountingEngine;
