import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requirePermission, getClientIp } from '@/lib/auth';
import AccountingEngine from '@/lib/accountingEngine';

export async function GET(request) {
  try {
    const authCheck = await requirePermission(request, 'hr:view');
    if (!authCheck.authorized) return authCheck.response;

    const { tenant_id } = authCheck.auth;
    const employees = db.get('employees', tenant_id);
    const attendance = db.get('attendance', tenant_id);
    const payroll = db.get('payroll', tenant_id);

    const totalMonthlyPayroll = employees.reduce((sum, e) => sum + (Number(e.basic_salary) || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        employees,
        attendance,
        payroll,
        totalMonthlyPayroll
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

    // 1. Clock In / Out
    if (action === 'clock-punch') {
      const authCheck = await requirePermission(request, 'hr:view');
      if (!authCheck.authorized) return authCheck.response;
      const { user, tenant_id } = authCheck.auth;

      const { employee_id, punch_type } = body;
      const employee = db.findById('employees', employee_id, tenant_id);
      if (!employee) return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });

      const today = new Date().toISOString().slice(0, 10);
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let records = db.get('attendance', tenant_id);
      let record = records.find(a => a.employee_id === employee_id && a.date === today);

      if (punch_type === 'in') {
        if (!record) {
          record = db.insert('attendance', {
            employee_id: employee.id,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            date: today,
            check_in: currentTime,
            check_out: '--',
            status: 'Present'
          }, tenant_id);
        } else {
          record = db.update('attendance', record.id, { check_in: currentTime, status: 'Present' }, tenant_id);
        }
        db.logAudit('ATTENDANCE_CLOCK_IN', 'HR', `${employee.first_name} ${employee.last_name} clocked in at ${currentTime}`, user, clientIp);
        return NextResponse.json({ success: true, message: `Clocked in at ${currentTime}`, data: record });
      } else {
        if (record) {
          record = db.update('attendance', record.id, { check_out: currentTime }, tenant_id);
        } else {
          record = db.insert('attendance', {
            employee_id: employee.id,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            date: today,
            check_in: '--',
            check_out: currentTime,
            status: 'Present'
          }, tenant_id);
        }
        db.logAudit('ATTENDANCE_CLOCK_OUT', 'HR', `${employee.first_name} ${employee.last_name} clocked out at ${currentTime}`, user, clientIp);
        return NextResponse.json({ success: true, message: `Clocked out at ${currentTime}`, data: record });
      }
    }

    // 2. Add Employee
    if (action === 'add-employee') {
      const authCheck = await requirePermission(request, 'hr:edit');
      if (!authCheck.authorized) return authCheck.response;
      const { user, tenant_id } = authCheck.auth;

      const { first_name, last_name, email, phone, department, designation, basic_salary } = body;
      if (!first_name || !last_name || !email) {
        return NextResponse.json({ success: false, message: 'Name and corporate email are required' }, { status: 400 });
      }

      const existing = db.get('employees', tenant_id).find(e => e.email?.toLowerCase() === email.toLowerCase());
      if (existing) {
        return NextResponse.json({ success: false, message: `Employee with email ${email} already enrolled` }, { status: 409 });
      }

      const count = db.get('employees', tenant_id).length + 101;
      const newEmp = db.insert('employees', {
        employee_code: `EMP-${count}`,
        first_name,
        last_name,
        email,
        phone: phone || '+1 (212) 555-0199',
        department: department || 'General Operations',
        designation: designation || 'Associate Specialist',
        join_date: new Date().toISOString().slice(0, 10),
        basic_salary: Number(basic_salary) || 7500,
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&auto=format&fit=crop&q=80'
      }, tenant_id);

      db.logAudit('EMPLOYEE_ONBOARDED', 'HR', `Onboarded ${first_name} ${last_name} into ${department}`, user, clientIp);
      return NextResponse.json({ success: true, message: 'Employee enrolled successfully', data: newEmp });
    }

    // 3. Run Payroll with Double-Entry Accounting
    if (action === 'run-payroll') {
      const authCheck = await requirePermission(request, 'hr:payroll');
      if (!authCheck.authorized) return authCheck.response;
      const { user, tenant_id } = authCheck.auth;

      const { month, year } = body;
      const employees = db.get('employees', tenant_id).filter(e => e.status === 'Active');
      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      const items = employees.map(emp => {
        const basic = Number(emp.basic_salary) || 0;
        const allowance = Math.round(basic * 0.1);
        const deduction = Math.round(basic * 0.15); // Tax + benefits
        const net = basic + allowance - deduction;
        totalGross += basic + allowance;
        totalDeductions += deduction;
        totalNet += net;
        return {
          employee_id: emp.id,
          employee_name: `${emp.first_name} ${emp.last_name}`,
          basic,
          allowance,
          deductions: deduction,
          net
        };
      });

      const newPayroll = db.insert('payroll', {
        month: month || 'September',
        year: year || 2026,
        total_gross: totalGross,
        total_deductions: totalDeductions,
        total_net: totalNet,
        status: 'Disbursed',
        payment_date: new Date().toISOString().slice(0, 10),
        items
      }, tenant_id);

      // Automated GAAP Double-Entry Payroll Voucher
      let accountingVoucher = null;
      try {
        accountingVoucher = AccountingEngine.postPayrollDisbursement(newPayroll, user, tenant_id);
      } catch (accErr) {
        console.warn('[HR API] Payroll voucher posting notice:', accErr.message);
      }

      db.logAudit('PAYROLL_PROCESSED', 'HR', `Disbursed ${month || 'September'} Payroll: $${totalNet.toLocaleString()}`, user, clientIp);

      return NextResponse.json({
        success: true,
        message: `Payroll for ${month} disbursed to ${employees.length} employees`,
        data: { payroll: newPayroll, accountingVoucher }
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const authCheck = await requirePermission(request, 'hr:edit');
    if (!authCheck.authorized) return authCheck.response;
    const { user, tenant_id } = authCheck.auth;
    const clientIp = getClientIp(request);

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, message: 'Employee ID required' }, { status: 400 });

    const employee = db.findById('employees', id, tenant_id);
    if (!employee) return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });

    const updated = db.update('employees', id, updates, tenant_id);
    db.logAudit('EMPLOYEE_UPDATED', 'HR', `Updated record for ${employee.first_name} ${employee.last_name}`, user, clientIp);

    return NextResponse.json({ success: true, message: 'Employee details updated', data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const authCheck = await requirePermission(request, 'hr:edit');
    if (!authCheck.authorized) return authCheck.response;
    const { user, tenant_id } = authCheck.auth;
    const clientIp = getClientIp(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Employee ID required' }, { status: 400 });

    const employee = db.findById('employees', id, tenant_id);
    if (!employee) return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });

    // Enterprise soft-deactivation to preserve historical payroll and audit trails
    const updated = db.update('employees', id, { status: 'Deactivated' }, tenant_id);
    db.logAudit('EMPLOYEE_DEACTIVATED', 'HR', `Deactivated employee ${employee.first_name} ${employee.last_name}`, user, clientIp);

    return NextResponse.json({ success: true, message: 'Employee record deactivated' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
