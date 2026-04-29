import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Calendar, CreditCard, Loader2, Plus, Search, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/common/Modal';
import ActionButtons from '../components/common/ActionButtons';
import EmployeeForm from '../components/forms/EmployeeForm';

const HR = () => {
    const [activeTab, setActiveTab] = useState('employees');
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);

    const { data: hrData, isLoading } = useQuery({
        queryKey: ['hr-data', activeTab],
        queryFn: async () => {
            let endpoint = '';
            if (activeTab === 'employees') endpoint = '/hr/employees';
            else if (activeTab === 'attendance') endpoint = '/hr/attendance';
            else if (activeTab === 'payroll') endpoint = '/hr/payroll';
            const response = await api.get(endpoint);
            return response.data.data || [];
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/hr/employees/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hr-data'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
    });

    const items = hrData || [];

    const tabs = [
        { id: 'employees', name: 'Employees', icon: Users },
        { id: 'attendance', name: 'Attendance', icon: Calendar },
        { id: 'payroll', name: 'Payroll', icon: CreditCard },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">HR Management</h1>
                    <p className="text-gray-500">Manage your workforce, attendance, and payroll.</p>
                </div>
                {activeTab === 'employees' && (
                    <button onClick={() => { setEditingEmployee(null); setIsEmployeeModalOpen(true); }} className="btn-primary flex items-center gap-2">
                        <Plus size={18} /> Add Employee
                    </button>
                )}
            </div>

            <div className="flex border-b border-gray-200">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <tab.icon size={18} /> {tab.name}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
                ) : (
                    <div className="overflow-x-auto">
                        {activeTab === 'employees' && (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Designation</th>
                                        <th className="px-6 py-4">Department</th>
                                        <th className="px-6 py-4">Join Date</th>
                                        <th className="px-6 py-4">Salary</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <Users size={32} className="text-gray-300" />
                                                    <p className="text-sm">No employees found. Click "Add Employee" to get started.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((emp) => (
                                            <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</div>
                                                    <div className="text-xs text-gray-500">{emp.email}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{emp.designation}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{emp.department}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{emp.join_date}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">${emp.salary}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <ActionButtons
                                                        onEdit={() => { setEditingEmployee(emp); setIsEmployeeModalOpen(true); }}
                                                        onDelete={() => deleteMutation.mutate(emp.id)}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'attendance' && (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Employee ID</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <Calendar size={32} className="text-gray-300" />
                                                    <p className="text-sm">No attendance records found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((att) => (
                                            <tr key={att.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-900">{att.date}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 font-mono">#{att.employee_id}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${att.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {att.status === 'Present' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                        {att.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'payroll' && (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Month</th>
                                        <th className="px-6 py-4">Employee ID</th>
                                        <th className="px-6 py-4">Net Salary</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <CreditCard size={32} className="text-gray-300" />
                                                    <p className="text-sm">No payroll records found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((pay) => (
                                            <tr key={pay.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{pay.month}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">#{pay.employee_id}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">${pay.net_salary}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                        <CheckCircle size={14} /> {pay.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            <Modal isOpen={isEmployeeModalOpen} onClose={() => { setIsEmployeeModalOpen(false); setEditingEmployee(null); }} title={editingEmployee ? 'Edit Employee' : 'Add New Employee'} maxWidth="max-w-2xl">
                <EmployeeForm
                    key={editingEmployee?.id || 'new'}
                    onSuccess={() => { setIsEmployeeModalOpen(false); setEditingEmployee(null); }}
                    onCancel={() => { setIsEmployeeModalOpen(false); setEditingEmployee(null); }}
                    initialData={editingEmployee}
                />
            </Modal>
        </div>
    );
};

export default HR;
