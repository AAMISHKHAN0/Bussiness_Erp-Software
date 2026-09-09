import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requirePermission, getClientIp } from '@/lib/auth';

export async function GET(request) {
  try {
    const authCheck = await requirePermission(request, 'settings:view');
    if (!authCheck.authorized) return authCheck.response;

    const { tenant_id } = authCheck.auth;
    const settings = db.getSettings(tenant_id);
    const auditLogs = db.get('audit_logs', tenant_id);
    const branches = db.get('branches', tenant_id);
    const roles = db.get('roles', tenant_id);
    const warehouses = db.get('warehouses', tenant_id);

    const systemHealth = {
      status: 'Operational',
      uptimeSeconds: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      databaseState: db.sql ? 'Neon Cloud PostgreSQL (Active Distributed Sync)' : 'Transactional Memory + Local Disk Sync',
      tenantId: tenant_id,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        settings,
        auditLogs: auditLogs.slice(0, 100),
        branches,
        warehouses,
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
    const clientIp = getClientIp(request);

    // Database Reset Action (Guarded strictly for Super Admin)
    if (action === 'reset-data') {
      const authCheck = await requirePermission(request, '*');
      if (!authCheck.authorized || authCheck.auth.user?.role !== 'Super Admin') {
        return NextResponse.json({ success: false, message: 'Only Super Admin may trigger database seed reset.' }, { status: 403 });
      }

      db.resetToSeed(authCheck.auth.user);
      db.logAudit('DATABASE_RESET', 'Admin', 'Database restored to initial enterprise benchmark dataset', authCheck.auth.user, clientIp);
      return NextResponse.json({ success: true, message: 'ERP Database restored to benchmark dataset.' });
    }

    // General Configuration Update
    const authCheck = await requirePermission(request, 'settings:edit');
    if (!authCheck.authorized) return authCheck.response;

    const { user, tenant_id } = authCheck.auth;
    const updatedSettings = db.updateSettings(body, tenant_id);
    db.logAudit('SETTINGS_UPDATED', 'Admin', `Company settings updated: ${body.company_name || 'System configs'}`, user, clientIp);

    return NextResponse.json({
      success: true,
      message: 'Global ERP configuration saved successfully',
      data: updatedSettings
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
