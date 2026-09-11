import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { requirePermission, getClientIp } from '@/lib/auth';
import { ROLES } from '@/lib/permissions';

export async function GET(request) {
  try {
    const authCheck = await requirePermission(request, 'users:view');
    if (!authCheck.authorized) return authCheck.response;

    const { tenant_id } = authCheck.auth;
    const users = db.get('users', tenant_id);
    const settings = db.getSettings(tenant_id);
    const branches = db.get('branches', tenant_id);

    // Organization-level configurable seat limitation (default: 4 active users)
    const maxUsers = Number(settings.max_users) || 4;

    const activeUsers = users.filter(u => u.is_active !== false && u.status !== 'Disabled');
    const activeCount = activeUsers.length;
    const availableSeats = Math.max(0, maxUsers - activeCount);
    const isLimitReached = activeCount >= maxUsers;

    // Sanitize sensitive credentials
    const safeUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      full_name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
      role: u.role,
      branch_id: u.branch_id || 'b-1',
      is_active: u.is_active !== false && u.status !== 'Disabled',
      status: (u.is_active !== false && u.status !== 'Disabled') ? 'Active' : 'Disabled',
      created_at: u.created_at || u.createdAt || new Date().toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: safeUsers,
        roles: Object.keys(ROLES),
        branches,
        seatInfo: {
          currentActive: activeCount,
          maxUsers,
          availableSeats,
          isLimitReached
        }
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

    const authCheck = await requirePermission(request, 'users:create');
    if (!authCheck.authorized) return authCheck.response;

    const { user: requestingUser, tenant_id } = authCheck.auth;
    const { email, password, first_name, last_name, role = 'Cashier', branch_id = 'b-1', is_active = true } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
    }

    const settings = db.getSettings(tenant_id);
    const maxUsers = Number(settings.max_users) || 4;

    // ENFORCE ACTIVE USER SEAT RESTRICTION SERVER-SIDE
    const existingUsers = db.get('users', tenant_id);
    const activeCount = existingUsers.filter(u => u.is_active !== false && u.status !== 'Disabled').length;
    const wantsActive = is_active !== false;

    if (wantsActive && activeCount >= maxUsers) {
      return NextResponse.json({
        success: false,
        error_code: 'SEAT_LIMIT_REACHED',
        message: `Active user limit reached: Your organization license permits a maximum of ${maxUsers} active users (${activeCount} currently active, 0 seats available). Please disable an existing user or upgrade your tier before creating user #${activeCount + 1}.`
      }, { status: 400 });
    }

    // Check duplicate email
    const duplicate = existingUsers.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (duplicate) {
      return NextResponse.json({ success: false, message: `A user with email ${email} already exists.` }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = db.insert('users', {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      password_hash: hashedPassword,
      first_name: first_name?.trim() || '',
      last_name: last_name?.trim() || '',
      role: ROLES[role] ? role : 'Cashier',
      branch_id: branch_id || 'b-1',
      is_active: wantsActive,
      status: wantsActive ? 'Active' : 'Disabled',
      created_at: new Date().toISOString()
    }, tenant_id);

    db.logAudit(
      'USER_CREATED',
      'User Management',
      `Created user account ${newUser.email} with role [${newUser.role}]. Active seats used: ${wantsActive ? activeCount + 1 : activeCount} of ${maxUsers}.`,
      requestingUser,
      clientIp
    );

    return NextResponse.json({
      success: true,
      message: `User ${newUser.email} created successfully.${wantsActive ? ` Active seats: ${activeCount + 1}/${maxUsers}` : ' (Created as Inactive)'}`,
      data: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        is_active: wantsActive
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

    // 1. TOGGLE ACTIVE / DISABLED STATUS (ENFORCING SEATS ON REACTIVATION)
    if (action === 'toggle-status') {
      const authCheck = await requirePermission(request, 'users:disable');
      if (!authCheck.authorized) return authCheck.response;

      const { user: requestingUser, tenant_id } = authCheck.auth;
      const { user_id, is_active } = body;

      const targetUser = db.findById('users', user_id, tenant_id);
      if (!targetUser) {
        return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
      }

      // Check if activating an inactive user would violate the 4-seat limit
      if (is_active) {
        const settings = db.getSettings(tenant_id);
        const maxUsers = Number(settings.max_users) || 4;
        const users = db.get('users', tenant_id);
        const activeCount = users.filter(u => u.id !== user_id && u.is_active !== false && u.status !== 'Disabled').length;

        if (activeCount >= maxUsers) {
          return NextResponse.json({
            success: false,
            error_code: 'SEAT_LIMIT_REACHED',
            message: `Cannot activate user: Active seat quota of ${maxUsers} is currently full (${activeCount} active). Deactivate another user first.`
          }, { status: 400 });
        }
      }

      db.update('users', targetUser.id, {
        is_active: Boolean(is_active),
        status: is_active ? 'Active' : 'Disabled'
      }, tenant_id);

      db.logAudit(
        'USER_STATUS_UPDATED',
        'User Management',
        `User ${targetUser.email} status changed to ${is_active ? 'Active' : 'Disabled'}`,
        requestingUser,
        clientIp
      );

      return NextResponse.json({
        success: true,
        message: `User ${targetUser.email} has been ${is_active ? 'activated' : 'disabled'}.`
      });
    }

    // 2. EDIT USER DETAILS & ROLE
    if (action === 'edit') {
      const authCheck = await requirePermission(request, 'users:edit');
      if (!authCheck.authorized) return authCheck.response;

      const { user: requestingUser, tenant_id } = authCheck.auth;
      const { user_id, first_name, last_name, role, branch_id } = body;

      const targetUser = db.findById('users', user_id, tenant_id);
      if (!targetUser) return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });

      const updates = {};
      if (first_name !== undefined) updates.first_name = first_name.trim();
      if (last_name !== undefined) updates.last_name = last_name.trim();
      if (role && ROLES[role]) updates.role = role;
      if (branch_id) updates.branch_id = branch_id;
      if (body.password && String(body.password).trim()) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(String(body.password).trim(), salt);
        updates.password = hashedPassword;
        updates.password_hash = hashedPassword;
      }

      db.update('users', targetUser.id, updates, tenant_id);

      db.logAudit('USER_UPDATED', 'User Management', `Updated profile for user ${targetUser.email}`, requestingUser, clientIp);
      return NextResponse.json({ success: true, message: 'User profile updated successfully.' });
    }

    return NextResponse.json({ success: false, message: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const authCheck = await requirePermission(request, 'users:disable');
    if (!authCheck.authorized) return authCheck.response;

    const { user: requestingUser, tenant_id } = authCheck.auth;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required.' }, { status: 400 });
    }

    if (userId === requestingUser.id) {
      return NextResponse.json({ success: false, message: 'Security restriction: You cannot delete your own active account.' }, { status: 400 });
    }

    const targetUser = db.findById('users', userId, tenant_id);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    db.delete('users', targetUser.id, tenant_id);
    db.persist('users');

    db.logAudit(
      'USER_DELETED',
      'User Management',
      `Permanently deleted user account ${targetUser.email} (${targetUser.role})`,
      requestingUser,
      getClientIp(request)
    );

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} has been permanently deleted.`
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
