/**
 * NEXIS ERP - Client & Server Safe RBAC Permissions Matrix
 * Pure JavaScript - No Node.js (fs, crypto, etc.) dependencies so it can safely be bundled in the browser.
 */

export const ROLE_PERMISSIONS = {
  'Super Admin': ['*'],
  'Administrator': ['*'],
  'Manager': [
    'dashboard:view', 'pos:*', 'sales:*', 'invoices:*', 'inventory:*',
    'customers:*', 'vendors:*', 'accounting:view', 'analytics:view', 'audit:view', 'users:view'
  ],
  'Accountant': [
    'dashboard:view', 'accounting:*', 'invoices:*', 'sales:view', 'pos:view',
    'customers:view', 'vendors:view', 'analytics:view'
  ],
  'Cashier': [
    'dashboard:view', 'pos:view', 'pos:sale', 'pos:discount', 'pos:close_register',
    'customers:view', 'inventory:view'
  ],
  'Executive Admin': [
    'dashboard:view', 'inventory:view', 'sales:view', 'pos:view', 'invoices:view',
    'procurement:view', 'customers:view', 'vendors:view', 'accounting:view', 'hr:view',
    'analytics:view', 'audit:view', 'settings:view', 'users:view'
  ],
  'Financial Controller': [
    'dashboard:view', 'accounting:*', 'invoices:*', 'sales:view', 'pos:view',
    'procurement:view', 'customers:view', 'vendors:view', 'analytics:view', 'audit:view'
  ],
  'Inventory Specialist': [
    'dashboard:view', 'inventory:*', 'procurement:view', 'procurement:receive',
    'vendors:view', 'analytics:view'
  ],
  'HR Director': [
    'dashboard:view', 'hr:*', 'analytics:view'
  ],
  'Senior Sales Representative': [
    'dashboard:view', 'sales:*', 'pos:view', 'pos:sale', 'invoices:view', 'customers:*',
    'inventory:view', 'analytics:view'
  ]
};

/**
 * Checks if a set of granted permissions satisfies the required permission.
 * Supports wildcard '*' for super admin and module wildcard '<module>:*' (e.g. 'accounting:*').
 *
 * @param {string[]} userPermissions - Array of granted permissions
 * @param {string} requiredPermission - Required permission string, e.g. 'inventory:write'
 * @returns {boolean}
 */
export function hasPermission(userPermissions, requiredPermission) {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes('*')) return true;

  const [reqModule, reqAction] = requiredPermission.split(':');
  
  return userPermissions.some(perm => {
    if (perm === requiredPermission) return true;
    if (perm === `${reqModule}:*`) return true;
    return false;
  });
}

export const ROLES = ROLE_PERMISSIONS;

