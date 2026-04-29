import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, CheckCircle2, AlertCircle, Scale, Paperclip, X } from 'lucide-react';
import api from '../../services/api';
import SearchableSelect from '../common/SearchableSelect';

const JournalEntryForm = ({ onSuccess, onCancel }) => {
    const queryClient = useQueryClient();

    // Fetch Chart of Accounts
    const { data: accounts = [], isLoading } = useQuery({
        queryKey: ['accounts'],
        queryFn: () => api.get('/accounting/accounts').then(res => res.data.data)
    });

    const accountOptions = useMemo(() => 
        accounts.map(acc => ({
            id: acc.id,
            label: acc.name,
            code: acc.code || acc.account_code,
            type: acc.type
        })), [accounts]
    );

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        attachment: null
    });

    const [lines, setLines] = useState([
        { id: '1', account_id: '', debit: '', credit: '', description: '' },
        { id: '2', account_id: '', debit: '', credit: '', description: '' }
    ]);

    // Real-time Reference Generation
    useEffect(() => {
        if (!formData.reference && accounts.length > 0) {
            const year = new Date().getFullYear();
            const random = Math.floor(1000 + Math.random() * 9000);
            setFormData(prev => ({ ...prev, reference: `JR-${year}-${random}` }));
        }
    }, [accounts]);

    // Totals & Validation Logic
    const totals = useMemo(() => {
        let debitTotal = 0;
        let creditTotal = 0;
        lines.forEach(line => {
            debitTotal += parseFloat(line.debit) || 0;
            creditTotal += parseFloat(line.credit) || 0;
        });

        const diff = Math.abs(debitTotal - creditTotal);
        const isBalanced = diff < 0.01 && debitTotal > 0;
        const hasMinLines = lines.length >= 2;
        const allLinesHaveAccount = lines.every(l => l.account_id);

        return {
            debitTotal,
            creditTotal,
            diff,
            isBalanced,
            isValid: isBalanced && hasMinLines && allLinesHaveAccount
        };
    }, [lines]);

    const mutation = useMutation({
        mutationFn: (journalData) => api.post('/accounting/journals', journalData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounting-data'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            onSuccess();
        }
    });

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLineChange = (id, field, value) => {
        setLines(prev => prev.map(line => {
            if (line.id === id) {
                const updated = { ...line, [field]: value };
                
                // Smart Input: Disable other side
                if (field === 'debit' && value !== '') updated.credit = '';
                if (field === 'credit' && value !== '') updated.debit = '';
                
                return updated;
            }
            return line;
        }));
    };

    const addLine = () => {
        setLines(prev => [...prev, { id: String(Date.now()), account_id: '', debit: '', credit: '', description: '' }]);
    };

    const removeLine = (id) => {
        if (lines.length <= 2) return;
        setLines(prev => prev.filter(line => line.id !== id));
    };

    const autoBalance = () => {
        const { debitTotal, creditTotal } = totals;
        const difference = debitTotal - creditTotal;
        if (difference === 0) return;

        const lastLineIndex = lines.length - 1;
        const lastLine = lines[lastLineIndex];

        setLines(prev => prev.map((line, idx) => {
            if (idx === lastLineIndex) {
                if (difference > 0) {
                    // We need more credit
                    return { ...line, credit: (parseFloat(line.credit) || 0) + difference, debit: '' };
                } else {
                    // We need more debit
                    return { ...line, debit: (parseFloat(line.debit) || 0) + Math.abs(difference), credit: '' };
                }
            }
            return line;
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setFormData(prev => ({ ...prev, attachment: file.name }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!totals.isValid) return;

        mutation.mutate({
            ...formData,
            lines: lines.map(line => ({
                ...line,
                debit: parseFloat(line.debit) || 0,
                credit: parseFloat(line.credit) || 0
            }))
        });
    };

    if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary-500 w-10 h-10" /></div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Main Form Fields */}
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date *</label>
                    <input required type="date" name="date" value={formData.date} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-white" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Reference Number</label>
                    <input type="text" name="reference" value={formData.reference} onChange={handleFormChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-white font-mono text-sm" placeholder="JR-2026-0001" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Attachment</label>
                    <div className="relative group">
                        <input type="file" id="journal-attachment" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
                        <button type="button" onClick={() => document.getElementById('journal-attachment').click()} className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white flex items-center gap-2 text-sm text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-all">
                            <Paperclip size={16} />
                            <span className="truncate">{formData.attachment || 'Upload PDF/Image'}</span>
                        </button>
                    </div>
                </div>
                <div className="col-span-1 sm:col-span-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Journal Memo / Background *</label>
                    <textarea required name="description" value={formData.description} onChange={handleFormChange} rows={1} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-white resize-none" placeholder="Reason for this journal entry..." />
                </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Scale size={18} className="text-gray-400" />
                        <h3 className="font-bold text-gray-800 text-sm">Balanced Entry Lines</h3>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={autoBalance} className="text-xs font-bold text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-200 transition-colors uppercase tracking-tight">Auto Balance</button>
                        <button type="button" onClick={addLine} className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-sm active:scale-95 uppercase tracking-tight">
                            <Plus size={14} /> Add Line
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-50/80 text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left w-1/3">Account</th>
                                <th className="px-4 py-3 text-left">Description</th>
                                <th className="px-4 py-3 text-right w-32">Debit</th>
                                <th className="px-4 py-3 text-right w-32">Credit</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {lines.map((line, idx) => (
                                <tr key={line.id} className="group hover:bg-gray-50/40 transition-colors">
                                    <td className="px-2 py-2">
                                        <SearchableSelect
                                            options={accountOptions}
                                            value={line.account_id}
                                            onChange={(val) => handleLineChange(line.id, 'account_id', val)}
                                            placeholder="Choose Account..."
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <input type="text" value={line.description} onChange={e => handleLineChange(line.id, 'description', e.target.value)} className="w-full px-3 py-1.5 border border-transparent focus:border-gray-200 focus:bg-white bg-transparent rounded text-sm hover:border-gray-200 transition-all outline-none" placeholder="Optional notes" />
                                    </td>
                                    <td className="px-2 py-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            disabled={line.credit !== '' && line.credit !== '0'}
                                            value={line.debit}
                                            onChange={e => handleLineChange(line.id, 'debit', e.target.value)}
                                            className={`w-full px-3 py-1.5 border border-transparent focus:border-primary-300 focus:bg-white bg-transparent rounded text-sm text-right transition-all outline-none font-medium ${line.debit ? 'text-primary-600' : 'text-gray-400'} disabled:opacity-30 disabled:cursor-not-allowed`}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            disabled={line.debit !== '' && line.debit !== '0'}
                                            value={line.credit}
                                            onChange={e => handleLineChange(line.id, 'credit', e.target.value)}
                                            className={`w-full px-3 py-1.5 border border-transparent focus:border-red-300 focus:bg-white bg-transparent rounded text-sm text-right transition-all outline-none font-medium ${line.credit ? 'text-red-600' : 'text-gray-400'} disabled:opacity-30 disabled:cursor-not-allowed`}
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <button type="button" onClick={() => removeLine(line.id)} disabled={lines.length <= 2} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-0">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Status Bar */}
                <div className="bg-gray-50/80 px-4 py-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            {totals.isBalanced ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-bold animate-in zoom-in duration-300">
                                    <CheckCircle2 size={14} /> Balanced ✓
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-red-700 text-xs font-bold animate-pulse">
                                    <AlertCircle size={14} /> Not Balanced ✗
                                </div>
                            )}
                            {!totals.isBalanced && (
                                <span className="text-xs font-medium text-gray-500">
                                    Difference: <span className="text-red-600 font-bold">${totals.diff.toFixed(2)}</span>
                                </span>
                            )}
                        </div>

                        <div className="flex gap-8 text-right">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Debit</span>
                                <span className="text-lg font-mono font-bold text-primary-600">${totals.debitTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Credit</span>
                                <span className="text-lg font-mono font-bold text-red-600">${totals.creditTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {mutation.isError && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-3 shadow-inner">
                    <AlertCircle size={18} />
                    {mutation.error.response?.data?.message || 'Failed to save journal entry. Please check your inputs.'}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-2">
                <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]">
                    Discard
                </button>
                <button type="submit" disabled={mutation.isPending || !totals.isValid} className={`flex-[2] px-4 py-3 text-white font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 active:scale-[0.98] ${totals.isValid ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-200/50' : 'bg-gray-300 cursor-not-allowed shadow-none'}`}>
                    {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                            <CheckCircle2 size={18} />
                            Save Journal Entry
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default JournalEntryForm;
