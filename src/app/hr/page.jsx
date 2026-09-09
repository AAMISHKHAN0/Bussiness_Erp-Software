'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/common/Modal';
import { useToast } from '@/context/ToastContext';
import { 
  Users, Plus, Clock, CheckCircle2, DollarSign, 
  Calendar, UserCheck, Loader2, Download, 
  Search, RefreshCw, Send 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency';

export default function HRPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employees'); // 'employees' | 'attendance' | 'payroll'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [selectedPaySlip, setSelectedPaySlip] = useState(null);

  const [employeeForm, setEmployeeForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: 'Operations & Engineering',
    designation: 'Infrastructure Specialist',
    basic_salary: 175000
  });

  const fetchHRData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr');
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data.employees || []);
        setAttendance(json.data.attendance || []);
        setPayroll(json.data.payroll || []);
      } else {
        toast.error(json.message || 'Failed to fetch HR data');
      }
    } catch (err) {
      toast.error('Network error loading human resources records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const handleClockPunch = async (punchType) => {
    const targetEmpId = employees[0]?.id;
    if (!targetEmpId) {
      toast.error('No employee profile found to log punch');
      return;
    }

    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clock-punch',
          employee_id: targetEmpId,
          punch_type: punchType
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || `Punch ${punchType} recorded`);
        fetchHRData();
      } else {
        toast.error(json.message || 'Failed to record punch');
      }
    } catch (err) {
      toast.error(err.message || 'Network error recording punch');
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-employee', ...employeeForm })
      });
      const json = await res.json();
      if (json.success) {
        setIsAddEmployeeOpen(false);
        fetchHRData();
        toast.success(`Employee ${employeeForm.first_name} ${employeeForm.last_name} onboarded successfully`);
        setEmployeeForm({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          department: 'Operations & Engineering',
          designation: 'Infrastructure Specialist',
          basic_salary: 11000
        });
      } else {
        toast.error(json.message || 'Failed to onboard employee');
      }
    } catch (err) {
      toast.error(err.message || 'Network error onboarding employee');
    }
  };

  const handleRunPayroll = async () => {
    if (!confirm('Execute monthly payroll disbursement? This will compute compensation, post GAAP expense vouchers, and update employee records.')) {
      return;
    }
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-payroll' })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Payroll cycle processed and posted to General Ledger');
        fetchHRData();
      } else {
        toast.error(json.message || 'Failed to process payroll');
      }
    } catch (err) {
      toast.error(err.message || 'Network error processing payroll');
    }
  };

  const filteredEmployees = employees.filter(e => 
    `${e.first_name} ${e.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const totalMonthlyPayroll = employees.reduce((sum, e) => sum + (Number(e.basic_salary) || 0), 0);

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Human Resources & Payroll
            </h1>
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Workforce Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Staff roster, verified digital attendance punch clock, and monthly compensation disbursals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchHRData}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          <button
            onClick={() => setIsAddEmployeeOpen(true)}
            className="btn-pod-blue group"
          >
            <span>Onboard Employee</span>
            <span className="pod-icon">
              <Plus size={13} className="text-white" />
            </span>
          </button>
        </div>
      </div>

      {/* Metrics Banner with Double-Bezel Architecture */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="double-bezel">
          <div className="double-bezel-inner">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Workforce</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{employees.length} Members</p>
            <p className="text-[10px] text-slate-400 mt-1">Direct corporate staff</p>
          </div>
        </div>
        <div className="double-bezel">
          <div className="double-bezel-inner">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Monthly Compensation Commitment</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1 tabular-nums">{formatCurrency(totalMonthlyPayroll)}</p>
            <p className="text-[10px] text-slate-400 mt-1">GAAP Account #6010 Payroll Expense</p>
          </div>
        </div>
        <div className="double-bezel">
          <div className="double-bezel-inner">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Attendance Today</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
              {attendance.filter(a => a.status === 'Present' || a.status === 'Remote').length} / {employees.length} Checked In
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Verified on-shift records</p>
          </div>
        </div>
      </div>

      {/* Digital Attendance Punch Clock Action Card */}
      <div className="double-bezel">
        <div className="double-bezel-inner !p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Executive Digital Attendance Punch Clock</h3>
              <p className="text-xs text-slate-500">Current active user: <strong className="text-slate-800">{user?.first_name} {user?.last_name} ({user?.role})</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => handleClockPunch('in')}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              Clock In
            </button>
            <button
              onClick={() => handleClockPunch('out')}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              Clock Out
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs with Double-Bezel Frame */}
      <div className="double-bezel">
        <div className="double-bezel-inner !p-1.5 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'employees', label: 'Employee Roster', icon: Users, count: employees.length },
            { id: 'attendance', label: 'Attendance Ledger', icon: Clock, count: attendance.length },
            { id: 'payroll', label: 'Payroll Issuance', icon: DollarSign, count: payroll.length },
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
          <p className="text-xs font-bold text-slate-500">Loading workforce records...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: EMPLOYEE DIRECTORY */}
          {activeTab === 'employees' && (
            <div className="space-y-4">
              <div className="double-bezel">
                <div className="double-bezel-inner !p-2.5">
                  <div className="relative max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search employees by name, department, or job title..."
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
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Department & Role</th>
                      <th className="py-3 px-4">Start Date</th>
                      <th className="py-3 px-4 text-right">Base Salary</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {emp.first_name} {emp.last_name}
                          <span className="block text-[10px] text-slate-400 font-normal">{emp.email}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{emp.employee_code}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {emp.designation}
                          <span className="block text-[10px] text-slate-500 font-normal">{emp.department}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">{emp.join_date}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(emp.basic_salary)}/mo
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                            {emp.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE LEDGER */}
          {activeTab === 'attendance' && (
            <div className="double-bezel">
              <div className="double-bezel-inner !p-0 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Employee Name</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Clock In Time</th>
                      <th className="py-3 px-4">Clock Out Time</th>
                      <th className="py-3 px-4 text-center">Attendance Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{att.employee_name}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">{att.date}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{att.check_in}</td>
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-600">{att.check_out}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            att.status === 'Present' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            att.status === 'Remote' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                            'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PAYROLL ISSUANCE */}
          {activeTab === 'payroll' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Automated Compensation Engine</h3>
                  <p className="text-xs text-slate-500">Calculates statutory deductions, logs employee remittances, and posts GAAP salary disbursement vouchers.</p>
                </div>
                <button
                  onClick={handleRunPayroll}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <DollarSign size={15} />
                  <span>Execute Monthly Payroll</span>
                </button>
              </div>

              {payroll.map((p) => (
                <div key={p.id} className="double-bezel">
                  <div className="double-bezel-inner !p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                      <div>
                        <h3 className="font-bold text-base text-slate-900">Payroll Cycle: {p.month} {p.year}</h3>
                        <p className="text-xs text-slate-500">Disbursed on {p.payment_date} via Corporate ACH</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-blue-600 text-lg tabular-nums">
                          {formatCurrency(p.total_net)}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-300">
                          {p.status}
                        </span>
                      </div>
                    </div>

                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                          <th className="py-2">Employee</th>
                          <th className="py-2 text-right">Base Pay</th>
                          <th className="py-2 text-right">Allowances</th>
                          <th className="py-2 text-right">Statutory Deductions</th>
                          <th className="py-2 text-right">Net Remittance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {p.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 font-sans font-medium text-slate-800">{item.employee_name}</td>
                            <td className="py-2.5 text-right text-slate-600 tabular-nums">{formatCurrency(item.basic)}</td>
                            <td className="py-2.5 text-right text-slate-600 tabular-nums">{formatCurrency(item.allowance)}</td>
                            <td className="py-2.5 text-right text-red-600 tabular-nums">-{formatCurrency(item.deductions)}</td>
                            <td className="py-2.5 text-right font-bold text-slate-900 tabular-nums">{formatCurrency(item.net)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal: Add Employee */}
      <Modal isOpen={isAddEmployeeOpen} onClose={() => setIsAddEmployeeOpen(false)} title="Onboard Corporate Employee">
        <form onSubmit={handleAddEmployee} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">First Name</label>
              <input
                type="text"
                value={employeeForm.first_name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, first_name: e.target.value })}
                placeholder="Alexander"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Last Name</label>
              <input
                type="text"
                value={employeeForm.last_name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, last_name: e.target.value })}
                placeholder="Sterling"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Corporate Email</label>
              <input
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                placeholder="asterling@company.com"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Telephone</label>
              <input
                type="text"
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                placeholder="+1 (212) 555-0101"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Department</label>
              <input
                type="text"
                value={employeeForm.department}
                onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                placeholder="Finance & Accounting"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Job Designation</label>
              <input
                type="text"
                value={employeeForm.designation}
                onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                placeholder="Senior Financial Analyst"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Monthly Gross Base Salary (PKR)</label>
              <input
                type="number"
                value={employeeForm.basic_salary}
                onChange={(e) => setEmployeeForm({ ...employeeForm, basic_salary: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono outline-none focus:border-blue-600"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddEmployeeOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
            >
              Confirm Employee Onboarding
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
