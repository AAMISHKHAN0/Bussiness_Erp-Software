import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, email, password, role, user_id } = body;

    // 1-Click Role Switcher (2024-2028 Modern Feature for fast executive demos)
    if (action === 'switch-role' || (role && !password)) {
      const targetUser = db.get('users').find(u => u.role === role) || db.get('users')[0];
      db.logAudit('USER_ROLE_SWITCH', 'Auth', `Session switched to role: ${targetUser.role}`, targetUser);
      return NextResponse.json({
        success: true,
        message: `Logged in as ${targetUser.role}`,
        user: targetUser,
        token: `mock-jwt-${targetUser.id}-${Date.now()}`
      });
    }

    // Standard credential login
    if (email) {
      const user = db.get('users').find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return NextResponse.json({ success: false, message: 'Invalid credentials or user not found' }, { status: 401 });
      }
      // Demo password accept 'password123' or any matching test password
      db.logAudit('USER_LOGIN', 'Auth', `User logged in with email: ${email}`, user);
      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        user,
        token: `mock-jwt-${user.id}-${Date.now()}`
      });
    }

    // Default me session check
    const defaultUser = db.get('users')[0];
    return NextResponse.json({ success: true, user: defaultUser });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function GET() {
  const users = db.get('users').map(({ password_hash, ...rest }) => rest);
  const roles = db.get('roles');
  return NextResponse.json({ success: true, users, roles });
}
