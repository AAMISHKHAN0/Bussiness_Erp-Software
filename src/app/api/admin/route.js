import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const settings = db.getSettings();
    const auditLogs = db.get('audit_logs');
    const branches = db.get('branches');
    const roles = db.get('roles');

    const systemHealth = {
      status: 'Operational',
      uptimeSeconds: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      databaseState: 'Active (Transactional In-Memory + Disk Sync)',
      totalRecords: Object.keys(db.data).reduce((acc, key) => acc + (Array.isArray(db.data[key]) ? db.data[key].length : 1), 0),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        settings,
        auditLogs: auditLogs.slice(0, 50),
        branches,
        roles,
        systemHealth
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Reset database to initial seed data
    if (action === 'reset-data') {
      db.resetToSeed();
      db.logAudit('DATABASE_RESET', 'Admin', 'Database reset to initial demo state');
      return NextResponse.json({ success: true, message: 'ERP Database restored to initial enterprise benchmark dataset.' });
    }

    const updatedSettings = db.updateSettings(body);
    db.logAudit('SETTINGS_UPDATED', 'Admin', `Company settings updated: ${body.company_name || 'System configs'}`);

    return NextResponse.json({
      success: true,
      message: 'Global ERP configuration saved',
      data: updatedSettings
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
