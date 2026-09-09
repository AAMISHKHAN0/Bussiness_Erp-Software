import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const employees = db.get('employees');
    const attendance = db.get('attendance');
    const payroll = db.get('payroll');

    return NextResponse.json({
      success: true,
      data: {
        employees,
        attendance,
        payroll,
        totalMonthlyPayroll: employees.reduce((sum, e) => sum + (Number(e.basic_salary) || 0), 0)
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

    // 1. Clock In / Out
    if (action === 'clock-punch') {
      const { employee_id, punch_type } = body;
      const employee = db.findById('employees', employee_id);
      if (!employee) return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });

      const today = new Date().toISOString().slice(0, 10);
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let record = db.get('attendance').find(a => a.employee_id === employee_id && a.date === today);

      if (punch_type === 'in') {
        if (!record) {
          record = db.insert('attendance', {
            employee_id: employee.id,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            date: today,
            check_in: currentTime,
            check_out: '--',
            status: 'Present'
          });
        } else {
          record = db.update('attendance', record.id, { check_in: currentTime, status: 'Present' });
        }
        db.logAudit('ATTENDANCE_CLOCK_IN', 'HR', `${employee.first_name} ${employee.last_name} clocked in at ${currentTime}`);
        return NextResponse.json({ success: true, message: `Clocked in at ${currentTime}`, data: record });
      } else {
        if (record) {
          record = db.update('attendance', record.id, { check_out: currentTime });
        } else {
          record = db.insert('attendance', {
            employee_id: employee.id,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            date: today,
            check_in: '--',
            check_out: currentTime,
            status: 'Present'
          });
        }
        db.logAudit('ATTENDANCE_CLOCK_OUT', 'HR', `${employee.first_name} ${employee.last_name} clocked out at ${currentTime}`);
        return NextResponse.json({ success: true, message: `Clocked out at ${currentTime}`, data: record });
      }
    }

    // 2. Add Employee
    if (action === 'add-employee') {
      const { first_name, last_name, email, phone, department, designation, basic_salary } = body;
      if (!first_name || !last_name || !email) {
        return NextResponse.json({ success: false, message: 'Name and email are required' }, { status: 400 });
      }

      const count = db.get('employees').length + 101;
      const newEmp = db.insert('employees', {
        employee_code: `APX-${count}`,
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
      });

      db.logAudit('EMPLOYEE_ONBOARDED', 'HR', `Onboarded ${first_name} ${last_name} into ${department}`);
      return NextResponse.json({ success: true, message: 'Employee enrolled successfully', data: newEmp });
    }

    // 3. Run Payroll
    if (action === 'run-payroll') {
      const { month, year } = body;
      const employees = db.get('employees');
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
      });

      db.logAudit('PAYROLL_PROCESSED', 'HR', `Disbursed ${month || 'September'} Payroll: $${totalNet.toLocaleString()}`);

      return NextResponse.json({
        success: true,
        message: `Payroll for ${month} disbursed to ${employees.length} employees`,
        data: newPayroll
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
