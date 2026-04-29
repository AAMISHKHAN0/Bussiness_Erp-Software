import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calculator, BookOpen, Repeat, Loader2, AlertCircle, Plus, Search, FileBarChart, Download } from 'lucide-react';
import api from '../services/api';
import { exportToCSV } from '../utils/exportUtils';
import Modal from '../components/common/Modal';
import ActionButtons from '../components/common/ActionButtons';
import AccountForm from '../components/forms/AccountForm';
import JournalEntryForm from '../components/forms/JournalEntryForm';

const Accounting = () => {
    const [activeTab, setActiveTab] = useState('coa');
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['accounting-data'],
        queryFn: async () => {
            const [accRes, txRes] = await Promise.all([
                api.get('/accounting/accounts').catch(() => ({ data: { data: [] } })),
                api.get('/accounting/transactions').catch(() => ({ data: { data: [] } }))
            ]);
            return {
                accounts: accRes.data.data || [],
                transactions: txRes.data.data || []
            };
        },
    });

    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

    const deleteMutation = useMutation({
        mutationFn: ({ endpoint, id }) => api.delete(`${endpoint}/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounting-data'] });
        }
    });

    const accData = data || { accounts: [], transactions: [] };

    const handleExport = () => {
        if (activeTab === 'coa') exportToCSV(accData.accounts, 'ChartOfAccounts_Export');
        if (activeTab === 'gl') exportToCSV(accData.transactions, 'GeneralLedger_Export');
        if (activeTab === 'reports') alert('Export not implemented for reports yet.');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Accounting & Finance</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage Chart of Accounts, Journal Entries, and Financial Reports.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={handleExport} className="btn-secondary flex items-center justify-center gap-2 whitespace-nowrap bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 font-medium transition-colors">
                        <Download size={18} /> Export
                    </button>
                    <button
                        onClick={() => {
                            if (activeTab === 'coa') setIsAccountModalOpen(true);
                            if (activeTab === 'gl') setIsJournalModalOpen(true);
                        }}
                        className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        {activeTab === 'coa' ? 'New Account' : 'New Journal Entry'}
                    </button>
                </div>
            </div>

            <div className="flex border-b border-gray-200 hide-scrollbar overflow-x-auto">
                <button onClick={() => setActiveTab('coa')} className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'coa' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <BookOpen size={18} /> Chart of Accounts
                </button>
                <button onClick={() => setActiveTab('gl')} className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'gl' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <Repeat size={18} /> General Ledger
                </button>
                <button onClick={() => setActiveTab('reports')} className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'reports' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <FileBarChart size={18} /> Financial Statements
                </button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder={`Search ${activeTab === 'coa' ? 'accounts' : 'transactions'}...`} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" />
                </div>
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                    <option>All Types</option>
                    <option>Asset</option>
                    <option>Liability</option>
                    <option>Equity</option>
                    <option>Revenue</option>
                    <option>Expense</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-gray-500">Loading financial data...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4 max-w-md mx-auto text-center p-6 bg-gray-50 rounded-lg m-6 border border-gray-100">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2"><AlertCircle size={24} /></div>
                        <h3 className="text-lg font-medium text-gray-900">Database Offline</h3>
                        <p className="text-gray-500 text-sm">The backend cannot connect to the database.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {activeTab === 'coa' && (
                            accData.accounts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100"><BookOpen size={32} className="text-gray-400" /></div>
                                    <h3 className="text-lg font-medium text-gray-900">No accounts found</h3>
                                    <p className="text-gray-500 text-sm">Create your first ledger account to see it here.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">Account Code</th>
                                            <th className="px-6 py-4">Account Name</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4 text-right">Current Balance</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {accData.accounts.map(account => (
                                            <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-sm text-gray-600">{account.account_code || account.code || '-'}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{account.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${account.type === 'Asset' ? 'bg-blue-100 text-blue-800' : account.type === 'Liability' ? 'bg-red-100 text-red-800' : account.type === 'Equity' ? 'bg-purple-100 text-purple-800' : account.type === 'Revenue' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                                                        {account.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                    ${parseFloat(account.current_balance || account.balance || 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <ActionButtons onDelete={() => deleteMutation.mutate({ endpoint: '/accounting/accounts', id: account.id })} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}

                        {activeTab === 'gl' && (
                            accData.transactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100"><Repeat size={32} className="text-gray-400" /></div>
                                    <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
                                    <p className="text-gray-500 text-sm">Post a journal entry to see it here.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4">Reference</th>
                                            <th className="px-6 py-4 text-right">Debit</th>
                                            <th className="px-6 py-4 text-right">Credit</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {accData.transactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{tx.description}</td>
                                                <td className="px-6 py-4 text-sm font-mono text-gray-600">{tx.reference_type} #{tx.reference_id}</td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-900">
                                                    {tx.entry_type === 'Debit' ? `$${parseFloat(tx.amount).toLocaleString()}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-900">
                                                    {tx.entry_type === 'Credit' ? `$${parseFloat(tx.amount).toLocaleString()}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <ActionButtons onDelete={() => deleteMutation.mutate({ endpoint: '/accounting/transactions', id: tx.id })} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}

                        {activeTab === 'reports' && (
                            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100"><FileBarChart size={32} className="text-gray-400" /></div>
                                <h3 className="text-lg font-medium text-gray-900">Financial Reports</h3>
                                <p className="text-gray-500 text-sm">Generate real-time reports from the backend.</p>
                                <div className="flex gap-4 mt-4">
                                    <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">Income Statement</button>
                                    <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">Balance Sheet</button>
                                    <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">Trial Balance</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} title="Create Ledger Account">
                <AccountForm onSuccess={() => setIsAccountModalOpen(false)} onCancel={() => setIsAccountModalOpen(false)} />
            </Modal>

            <Modal isOpen={isJournalModalOpen} onClose={() => setIsJournalModalOpen(false)} title="New Journal Entry" maxWidth="max-w-3xl">
                <JournalEntryForm onSuccess={() => setIsJournalModalOpen(false)} onCancel={() => setIsJournalModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default Accounting;
