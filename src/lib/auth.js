import jwt from 'jsonwebtoken';
import db from './db';
import { ROLE_PERMISSIONS, hasPermission } from './permissions';

export { ROLE_PERMISSIONS, hasPermission };

const JWT_SECRET = process.env.JWT_SECRET || 'nexis-enterprise-erp-secure-production-jwt-key-2026';


/**
 * Generate a cryptographically signed JWT session token
 */
export function signToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      tenant_id: payload.tenant_id || 'tenant-default',
      branch_id: payload.branch_id || 'b-1',
      first_name: payload.first_name,
      last_name: payload.last_name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify JWT token string
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Extract auth token from request Authorization header or cookie
 */
export function extractToken(request) {
  // 1. Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Cookie header: nexis_token=...
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      })
    );
    if (cookies.nexis_token) return cookies.nexis_token;
    if (cookies.erp_token) return cookies.erp_token;
  }

  return null;
}

/**
 * Verifies caller authentication and returns authenticated user context
 */
export async function verifyAuth(request) {
  const token = extractToken(request);
  if (!token) {
    return {
      authenticated: false,
      user: null,
      tenant_id: 'tenant-default',
      error: 'Authentication credentials missing'
    };
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return {
      authenticated: false,
      user: null,
      tenant_id: 'tenant-default',
      error: 'Invalid or expired session token'
    };
  }

  // Ensure user still exists and is active in database
  const user = db.findById('users', decoded.id);
  if (!user || user.is_active === false) {
    return {
      authenticated: false,
      user: null,
      tenant_id: 'tenant-default',
      error: 'User account disabled or not found'
    };
  }

  const role = user.role || decoded.role;
  const tenant_id = user.tenant_id || decoded.tenant_id || 'tenant-default';
  const permissions = ROLE_PERMISSIONS[role] || [];

  return {
    authenticated: true,
    user,
    tenant_id,
    role,
    permissions
  };
}


/**
 * Middleware utility to assert permission or return 401/403 NextResponse
 */
export async function requirePermission(request, requiredPermission) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return {
      authorized: false,
      response: Response.json(
        { success: false, message: auth.error || 'Authentication required' },
        { status: 401 }
      ),
      auth: null
    };
  }

  if (requiredPermission && !hasPermission(auth.permissions, requiredPermission)) {
    return {
      authorized: false,
      response: Response.json(
        { 
          success: false, 
          message: `Access denied. Role '${auth.role}' lacks permission '${requiredPermission}'` 
        },
        { status: 403 }
      ),
      auth
    };
  }

  return {
    authorized: true,
    response: null,
    auth
  };
}

/**
 * Extract real client IP from incoming request
 */
export function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}
