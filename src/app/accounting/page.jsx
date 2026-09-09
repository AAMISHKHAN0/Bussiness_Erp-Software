'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/common/Modal';
import { useToast } from '@/context/ToastContext';
import { 
  Calculator, BookOpen, Repeat, FileBarChart, Plus, 
  Search, CheckCircle2, AlertCircle, Scale, 
  TrendingUp, Loader2, RefreshCw, Trash2 
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export default function AccountingPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('coa'); // 'coa' | 'gl' | 'balanceSheet' | 'pnl' | 'trialBalance'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  // New Account Form
  const [accountForm, setAccountForm] = useState({
    code: '',
    name: '',
    type: 'Asset',
    category: 'Current Assets',
    balance: 0
  });

  // Journal Entry Form with multiple lines
  const [journalForm, setJournalForm] = useState({
    description: '',
    reference_number: '',
    entry_date: new Date().toISOString().slice(0, 10),
    lines: [
      { account_id: '', debit: 1000, credit: 0 },
      { account_id: '', debit: 0, credit: 1000 }
    ]
  });

  const fetchAccounting = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounting');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.message || 'Failed to fetch ledger accounts');
      }
    } catch (err) {
      toast.error('Network error loading general ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounting();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-account', ...accountForm })
      });
      const json = await res.json();
      if (json.success) {
        setIsAccountModalOpen(false);
        fetchAccounting();
        toast.success(`Account #${accountForm.code} (${accountForm.name}) created in Chart of Accounts`);
        setAccountForm({ code: '', name: '', type: 'Asset', category: 'Current Assets', balance: 0 });
      } else {
        toast.error(json.message || 'Failed to create account');
      }
    } catch (err) {
      toast.error(err.message || 'Network error creating account');
    }
  };

  const handlePostJournal = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'post-journal', ...journalForm })
      });
      const json = await res.json();
      if (json.success) {
        setIsJournalModalOpen(false);
        fetchAccounting();
        toast.success('Balanced GAAP journal voucher posted to General Ledger');
      } else {
        toast.error(json.message || 'Journal entry rejected');
      }
    } catch (err) {
      toast.error(err.message || 'Network error posting journal');
    }
  };


  const addJournalLine = () => {
    setJournalForm({
      ...journalForm,
      lines: [...journalForm.lines, { account_id: '', debit: 0, credit: 0 }]
    });
  };

  const removeJournalLine = (idx) => {
    if (journalForm.lines.length <= 2) return;
    setJournalForm({
      ...journalForm,
      lines: journalForm.lines.filter((_, i) => i !== idx)
    });
  };

  const updateJournalLine = (idx, field, val) => {
    const updated = [...journalForm.lines];
    updated[idx][field] = val;
    setJournalForm({ ...journalForm, lines: updated });
  };

  const totalDebits = journalForm.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredits = journalForm.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isVoucherBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  const accounts = data?.accounts || [];
  const journalEntries = data?.journalEntries || [];
  const statements = data?.statements || {};

  const filteredAccounts = accounts.filter(a => 
    a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Financial Accounting Suite
            </h1>
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              GAAP General Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standard Chart of Accounts, balanced double-entry vouchers, live Balance Sheet, and Income Statement.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAccounting}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          <button
            onClick={() => setIsJournalModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2 transition-colors shadow-2xs"
          >
            <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Repeat size={12} />
            </span>
            <span>Post Journal Voucher</span>
          </button>
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="btn-pod-blue group"
          >
            <span>New Ledger Account</span>
            <span className="pod-icon">
              <Plus size={13} className="text-white" />
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs with Double-Bezel Frame */}
      <div className="double-bezel">
        <div className="double-bezel-inner !p-1.5 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'coa', label: 'Chart of Accounts', icon: BookOpen, count: accounts.length },
            { id: 'gl', label: 'Journal Vouchers', icon: Repeat, count: journalEntries.length },
            { id: 'balanceSheet', label: 'Balance Sheet', icon: Scale },
            { id: 'pnl', label: 'Income Statement (P&L)', icon: TrendingUp },
            { id: 'trialBalance', label: 'Trial Balance', icon: FileBarChart },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500">Calculating financial ledgers...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: CHART OF ACCOUNTS */}
          {activeTab === 'coa' && (
            <div className="space-y-4">
              <div className="double-bezel">
                <div className="double-bezel-inner !p-2.5 flex items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search Account Code, Name, or Classification..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="double-bezel">
                <div className="double-bezel-inner !p-0 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Account Code</th>
                        <th className="py-3 px-4">Account Description</th>
                        <th className="py-3 px-4">Classification</th>
                        <th className="py-3 px-4">Category Group</th>
                        <th className="py-3 px-4 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAccounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">{acc.code}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{acc.name}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              acc.type === 'Asset' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              acc.type === 'Liability' ? 'bg-red-50 text-red-700 border-red-200' :
                              acc.type === 'Equity' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              acc.type === 'Revenue' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {acc.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">{acc.category}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm tabular-nums">
                            {formatCurrency(acc.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL LEDGER ENTRIES */}
          {activeTab === 'gl' && (
            <div className="space-y-4">
              <div className="double-bezel">
                <div className="double-bezel-inner space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Journal Transaction Vouchers</h3>
                      <p className="text-xs text-slate-500">Chronological verified GAAP double-entry postings</p>
                    </div>
                    <span className="text-xs font-mono text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                      {journalEntries.length} Vouchers Posted
                    </span>
                  </div>

                  <div className="space-y-4">
                    {journalEntries.map((entry) => (
                      <div key={entry.id} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600 text-sm">{entry.entry_number}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-xs text-slate-800 font-semibold">{entry.description}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                            <span>Ref: {entry.reference_number}</span>
                            <span>{entry.entry_date}</span>
                          </div>
                        </div>

                        {/* Lines Table */}
                        <table className="w-full text-left text-xs border-t border-slate-200 pt-2">
                          <thead>
                            <tr className="text-slate-500 font-bold uppercase text-[10px]">
                              <th className="py-1">Account</th>
                              <th className="py-1 text-right">Debit (Dr)</th>
                              <th className="py-1 text-right">Credit (Cr)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60">
                            {entry.lines?.map((line, idx) => (
                              <tr key={idx}>
                                <td className="py-1.5 text-slate-700 font-medium">
                                  {line.account_name || `Account ID: ${line.account_id}`}
                                </td>
                                <td className="py-1.5 text-right font-mono font-bold text-emerald-600 tabular-nums">
                                  {Number(line.debit) > 0 ? formatCurrency(line.debit) : '—'}
                                </td>
                                <td className="py-1.5 text-right font-mono font-bold text-slate-700 tabular-nums">
                                  {Number(line.credit) > 0 ? formatCurrency(line.credit) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BALANCE SHEET */}
          {activeTab === 'balanceSheet' && statements.balanceSheet && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets Section */}
              <div className="double-bezel">
                <div className="double-bezel-inner h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <h3 className="text-lg font-extrabold text-slate-900">ASSETS</h3>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Resources Owned</span>
                    </div>
                    <div className="divide-y divide-slate-100 mt-4 text-xs">
                      {statements.balanceSheet.assets.map(a => (
                        <div key={a.id} className="py-2.5 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-800">{a.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">Code {a.code} · {a.category}</p>
                          </div>
                          <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">{formatCurrency(a.balance)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-6 border-t-2 border-slate-300 flex justify-between items-center">
                    <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">TOTAL ASSETS</span>
                    <span className="text-xl font-extrabold text-blue-600 font-mono tabular-nums">
                      {formatCurrency(statements.balanceSheet.totalAssets)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity Section */}
              <div className="double-bezel">
                <div className="double-bezel-inner h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <h3 className="text-lg font-extrabold text-slate-900">LIABILITIES & EQUITY</h3>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Obligations & Capital</span>
                    </div>

                    {/* Liabilities */}
                    <div className="mt-4">
                      <p className="text-[11px] font-bold uppercase text-red-600 tracking-wider mb-2">Liabilities</p>
                      <div className="divide-y divide-slate-100 text-xs">
                        {statements.balanceSheet.liabilities.map(l => (
                          <div key={l.id} className="py-2 flex justify-between items-center">
                            <span className="text-slate-700">{l.name}</span>
                            <span className="font-mono font-bold text-slate-900 tabular-nums">{formatCurrency(l.balance)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Equity */}
                    <div className="mt-5">
                      <p className="text-[11px] font-bold uppercase text-purple-700 tracking-wider mb-2">Stockholders Equity</p>
                      <div className="divide-y divide-slate-100 text-xs">
                        {statements.balanceSheet.equity.map(e => (
                          <div key={e.id} className="py-2 flex justify-between items-center">
                            <span className="text-slate-700">{e.name}</span>
                            <span className="font-mono font-bold text-slate-900 tabular-nums">{formatCurrency(e.balance)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-6 border-t-2 border-slate-300 flex justify-between items-center">
                    <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">TOTAL LIAB. + EQUITY</span>
                    <span className="text-xl font-extrabold text-blue-600 font-mono tabular-nums">
                      {formatCurrency(statements.balanceSheet.totalLiabilities + statements.balanceSheet.totalEquity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INCOME STATEMENT (P&L) */}
          {activeTab === 'pnl' && statements.incomeStatement && (
            <div className="max-w-3xl mx-auto double-bezel">
              <div className="double-bezel-inner !p-8 text-xs space-y-6">
                <div className="text-center pb-4 border-b border-slate-200">
                  <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Statement of Profit and Loss (Income Statement)</h2>
                  <p className="text-slate-500 text-xs mt-1">GAAP Financial Accounting Period 2026 (Currency: PKR)</p>
                </div>

                {/* Operating Revenue */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center font-bold text-emerald-700 uppercase text-[11px] tracking-wider">
                    <span>Gross Commercial Revenue</span>
                    <span>Amount</span>
                  </div>
                  {statements.incomeStatement.revenue.map(r => (
                    <div key={r.id} className="flex justify-between items-center py-1 text-slate-700">
                      <span>{r.name}</span>
                      <span className="font-mono font-bold tabular-nums">{formatCurrency(r.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-extrabold text-sm pt-2 border-t border-slate-200 text-slate-900">
                    <span>Total Revenue</span>
                    <span className="text-emerald-600 font-mono tabular-nums">{formatCurrency(statements.incomeStatement.totalRevenue)}</span>
                  </div>
                </div>

                {/* Cost of Goods Sold */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center font-bold text-slate-600 uppercase text-[11px] tracking-wider">
                    <span>Cost of Goods Sold (COGS)</span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-slate-700">
                    <span>Direct Production & Hardware Acquisition Costs</span>
                    <span className="font-mono font-bold text-red-600 tabular-nums">-{formatCurrency(statements.incomeStatement.cogs)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm pt-2 border-t border-slate-200 text-slate-900">
                    <span>Gross Profit</span>
                    <span className="text-blue-600 font-mono tabular-nums">{formatCurrency(statements.incomeStatement.grossProfit)}</span>
                  </div>
                </div>

                {/* Operating Expenses */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                    <span>Operating Expenses (OPEX)</span>
                  </div>
                  {statements.incomeStatement.expenses.map(e => (
                    <div key={e.id} className="flex justify-between items-center py-1 text-slate-700">
                      <span>{e.name}</span>
                      <span className="font-mono tabular-nums">{formatCurrency(e.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-slate-800 pt-2 border-t border-slate-200">
                    <span>Total Operating Expenses</span>
                    <span className="font-mono text-red-600 tabular-nums">-{formatCurrency(statements.incomeStatement.totalExpenses)}</span>
                  </div>
                </div>

                {/* Net Income */}
                <div className="pt-4 border-t-2 border-slate-400 flex justify-between items-center text-base font-extrabold">
                  <span className="text-slate-900 uppercase tracking-wider">NET OPERATING PROFIT</span>
                  <span className="text-blue-600 font-mono text-xl tabular-nums">
                    {formatCurrency(statements.incomeStatement.netIncome)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TRIAL BALANCE */}
          {activeTab === 'trialBalance' && statements.trialBalance && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                statements.trialBalance.isBalanced 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  <span className="font-bold">
                    {statements.trialBalance.isBalanced ? 'Trial Balance Reconciled: Total Debits Exactly Match Credits' : 'Warning: Debits and Credits Out of Balance'}
                  </span>
                </div>
                <div className="font-mono font-bold tabular-nums">
                  Dr: {formatCurrency(statements.trialBalance.totalDebits)} · Cr: {formatCurrency(statements.trialBalance.totalCredits)}
                </div>
              </div>

              <div className="double-bezel">
                <div className="double-bezel-inner !p-0 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Account Description</th>
                        <th className="py-3 px-4">Classification</th>
                        <th className="py-3 px-4 text-right">Debit Balance</th>
                        <th className="py-3 px-4 text-right">Credit Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {statements.trialBalance.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-blue-600">{item.code}</td>
                          <td className="py-2.5 px-4 font-sans font-medium text-slate-800">{item.name}</td>
                          <td className="py-2.5 px-4 font-sans text-slate-500">{item.type}</td>
                          <td className="py-2.5 px-4 text-right text-slate-900 tabular-nums">
                            {item.debit > 0 ? formatCurrency(item.debit) : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-900 tabular-nums">
                            {item.credit > 0 ? formatCurrency(item.credit) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-400 bg-slate-50 font-bold text-slate-900 font-mono">
                        <td colSpan="3" className="py-3 px-4 uppercase tracking-wider font-sans">Trial Balance Totals</td>
                        <td className="py-3 px-4 text-right text-blue-600 font-extrabold text-sm tabular-nums">
                          {formatCurrency(statements.trialBalance.totalDebits)}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-600 font-extrabold text-sm tabular-nums">
                          {formatCurrency(statements.trialBalance.totalCredits)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: New Ledger Account */}
      <Modal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} title="Initialize GAAP Ledger Account">
        <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Account Code (GAAP)</label>
              <input
                type="text"
                value={accountForm.code}
                onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })}
                placeholder="e.g. 1030"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Account Name</label>
              <input
                type="text"
                value={accountForm.name}
                onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                placeholder="e.g. Short-term Treasury Bills"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Classification Type</label>
              <select
                value={accountForm.type}
                onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              >
                <option value="Asset">Asset (Debit Normal)</option>
                <option value="Liability">Liability (Credit Normal)</option>
                <option value="Equity">Equity (Credit Normal)</option>
                <option value="Revenue">Revenue (Credit Normal)</option>
                <option value="Expense">Expense (Debit Normal)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Group Category</label>
              <input
                type="text"
                value={accountForm.category}
                onChange={(e) => setAccountForm({ ...accountForm, category: e.target.value })}
                placeholder="Current Assets"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Opening Balance (PKR)</label>
              <input
                type="number"
                step="1"
                value={accountForm.balance}
                onChange={(e) => setAccountForm({ ...accountForm, balance: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
            >
              Initialize Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Post Journal Entry */}
      <Modal isOpen={isJournalModalOpen} onClose={() => setIsJournalModalOpen(false)} title="Record Double-Entry Journal Voucher" maxWidth="max-w-3xl">
        <form onSubmit={handlePostJournal} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Transaction Description</label>
              <input
                type="text"
                value={journalForm.description}
                onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                placeholder="e.g. Purchase of office hardware fixtures"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Document Reference #</label>
              <input
                type="text"
                value={journalForm.reference_number}
                onChange={(e) => setJournalForm({ ...journalForm, reference_number: e.target.value })}
                placeholder="REF-VOUCH-01"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-mono"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">Debit & Credit Voucher Lines</span>
              <button
                type="button"
                onClick={addJournalLine}
                className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1"
              >
                <Plus size={14} /> Add Line
              </button>
            </div>

            {journalForm.lines.map((line, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex-1">
                  <select
                    value={line.account_id}
                    onChange={(e) => updateJournalLine(idx, 'account_id', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 outline-none focus:border-blue-600"
                    required
                  >
                    <option value="" disabled>Select ledger account...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.type})</option>
                    ))}
                  </select>
                </div>

                <div className="w-32">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={line.debit}
                    onChange={(e) => updateJournalLine(idx, 'debit', Number(e.target.value))}
                    placeholder="Debit"
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 text-right font-mono outline-none focus:border-blue-600"
                  />
                </div>

                <div className="w-32">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={line.credit}
                    onChange={(e) => updateJournalLine(idx, 'credit', Number(e.target.value))}
                    placeholder="Credit"
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 text-right font-mono outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeJournalLine(idx)}
                  disabled={journalForm.lines.length <= 2}
                  className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Validation Banner */}
          <div className={`p-3 rounded-lg border flex items-center justify-between text-xs font-mono font-bold ${
            isVoucherBalanced 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}>
            <div className="flex items-center gap-1.5 font-sans">
              {isVoucherBalanced ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{isVoucherBalanced ? 'Voucher Balanced (Debits = Credits)' : 'Out of Balance: Total Debits must equal Credits'}</span>
            </div>
            <div>
              Dr: {formatCurrency(totalDebits)} | Cr: {formatCurrency(totalCredits)}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsJournalModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isVoucherBalanced}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold shadow-xs"
            >
              Post to General Ledger
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
