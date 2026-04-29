import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(__dirname, '..', '..', 'utils', 'data.json');

interface MockData {
    [key: string]: any[];
}

interface GlobalStorage {
    master: { companies: any[] };
    tenants: { [tenantId: string]: MockData };
}

const DEFAULT_TEMPLATE = (): MockData => {
    const data: MockData = {
        roles: [
            { id: '1', name: 'Super Admin' },
            { id: '2', name: 'Admin' }
        ],
        branches: [
            { id: '1', name: 'Main Headquarters' }
        ],
        users: [
            {
                id: '1',
                email: 'admin@company.com',
                password_hash: '', // Will be set below
                first_name: 'Super',
                last_name: 'Admin',
                role_id: '1',
                branch_id: '1',
                is_active: true
            }
        ],
        permissions: [
            { id: '1', name: 'view_dashboard' },
            { id: '2', name: 'manage_users' },
            { id: '3', name: 'manage_roles' },
            { id: '4', name: 'view_inventory' },
            { id: '5', name: 'manage_inventory' },
            { id: '6', name: 'view_sales' },
            { id: '7', name: 'manage_sales' },
            { id: '8', name: 'view_purchases' },
            { id: '9', name: 'manage_purchases' },
            { id: '10', name: 'view_media' },
            { id: '11', name: 'upload_files' },
            { id: '12', name: 'view_reports' },
            { id: '13', name: 'view_accounting' },
            { id: '14', name: 'manage_accounting' },
            { id: '15', name: 'view_hr' },
            { id: '16', name: 'manage_hr' }
        ],
        role_permissions: [
            { role_id: '1', permission_id: '1' },
            { role_id: '1', permission_id: '2' },
            { role_id: '1', permission_id: '3' },
            { role_id: '1', permission_id: '4' },
            { role_id: '1', permission_id: '5' },
            { role_id: '1', permission_id: '6' },
            { role_id: '1', permission_id: '7' },
            { role_id: '1', permission_id: '8' },
            { role_id: '1', permission_id: '9' },
            { role_id: '1', permission_id: '10' },
            { role_id: '1', permission_id: '11' },
            { role_id: '1', permission_id: '12' },
            { role_id: '1', permission_id: '13' },
            { role_id: '1', permission_id: '14' },
            { role_id: '1', permission_id: '15' },
            { role_id: '1', permission_id: '16' }
        ],
        employees: [],
        attendance: [],
        payroll: [],
        products: [],
        product_categories: [],
        suppliers: [],
        sales_orders: [],
        customers: [],
        inventory: [],
        stock_movements: [],
        audit_logs: [],
        invoices: [],
        accounts: [
            { id: '1', name: 'Main Cash Account', code: '1000', type: 'Asset', balance: 0, is_active: true },
            { id: '2', name: 'Inventory Asset', code: '1200', type: 'Asset', balance: 0, is_active: true },
            { id: '3', name: 'Sales Revenue', code: '4000', type: 'Revenue', balance: 0, is_active: true },
            { id: '4', name: 'Cost of Goods Sold', code: '5000', type: 'Expense', balance: 0, is_active: true }
        ],
        sales_order_items: [],
        invoice_items: [],
        transactions: [],
        journal_entries: [],
        journal_entry_lines: [],
        purchase_orders: [],
        purchase_order_items: []
    };
    data.users[0].password_hash = bcrypt.hashSync('password123', 10);
    return data;
};

let MOCK_STORAGE: GlobalStorage = {
    master: {
        companies: [
            { id: 'company1', name: 'CoreTech Industries', slug: 'company1', db_name: 'mock_db', db_host: 'localhost', db_user: 'mock', encrypted_password: 'mock', plan: 'enterprise', status: 'active' },
            { id: 'company2', name: 'Stark Enterprises', slug: 'company2', db_name: 'mock_db', db_host: 'localhost', db_user: 'mock', encrypted_password: 'mock', plan: 'enterprise', status: 'active' }
        ]
    },
    tenants: {}
};

// Helper to save data to disk
const saveToDisk = () => {
    try {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DB_PATH, JSON.stringify(MOCK_STORAGE, null, 2));
    } catch (err) {
        console.error('[MockDB] Failed to save data:', err);
    }
};

// Helper to load data from disk
const loadFromDisk = () => {
    try {
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf8');
            const parsed = JSON.parse(data);
            if (parsed.master && parsed.tenants) {
                MOCK_STORAGE = parsed;
            } else {
                // Migrate old format to new format
                MOCK_STORAGE.tenants['master'] = parsed;
                MOCK_STORAGE.tenants['company1'] = parsed;
                saveToDisk();
            }
            console.log('[MockDB] Data loaded from disk');
        } else {
            console.log('[MockDB] No data.json found, using defaults');
            saveToDisk();
        }
    } catch (err) {
        console.error('[MockDB] Failed to load data:', err);
    }
};

// Initialize persistence
if (fs.existsSync(DB_PATH)) {
    loadFromDisk();
} else {
    const oldPath = path.join(__dirname, '..', '..', 'utils', 'data.json');
    if (fs.existsSync(oldPath)) {
        try {
            const data = fs.readFileSync(oldPath, 'utf8');
            MOCK_STORAGE.tenants['master'] = JSON.parse(data);
        } catch (e) {}
    }
}

export const handleMockQuery = async (text: string, params: any[] = [], tenantId: string = 'master'): Promise<any> => {
    if (tenantId === 'master' && text.toLowerCase().includes('from companies')) {
        let results = [...MOCK_STORAGE.master.companies];
        if (text.toLowerCase().includes('slug = $1') || text.toLowerCase().includes('slug=$1')) {
            results = results.filter(c => c.slug === params[0]);
        } else if (text.toLowerCase().includes('id = $1') || text.toLowerCase().includes('id=$1')) {
            results = results.filter(c => c.id === params[0]);
        }
        return { rows: results, rowCount: results.length };
    }

    if (!MOCK_STORAGE.tenants[tenantId]) {
        MOCK_STORAGE.tenants[tenantId] = DEFAULT_TEMPLATE();
        saveToDisk();
    }
    const MOCK_DATA = MOCK_STORAGE.tenants[tenantId];

    const query = text.trim().toLowerCase().replace(/\s+/g, ' ').replace(/;/g, '').trim();

    // Transaction Management
    if (['begin', 'commit', 'rollback'].includes(query)) {
        return { rows: [], rowCount: 0 };
    }

    // Generic INSERT Parser
    if (query.startsWith('insert into')) {
        const tableMatch = query.match(/insert into\s+([a-z0-9_]+)/i);
        if (tableMatch) {
            const table = tableMatch[1].toLowerCase();
            if (!MOCK_DATA[table]) MOCK_DATA[table] = [];

            // Special handling for inventory upsert (ON CONFLICT)
            if (table === 'inventory' && query.includes('on conflict')) {
                const productId = params[0];
                const branchId = params[1];
                const qtyVal = Number(params[2]) || 0;

                let record = MOCK_DATA.inventory.find(i => i.product_id == productId && i.branch_id == branchId);
                if (record) {
                    if (query.includes('inventory.quantity +')) {
                        record.quantity = Number(record.quantity) + qtyVal;
                    } else {
                        record.quantity = qtyVal;
                    }
                    record.last_updated = new Date().toISOString();
                } else {
                    record = {
                        id: String(MOCK_DATA.inventory.length + 1),
                        product_id: productId,
                        branch_id: branchId,
                        quantity: qtyVal,
                        last_updated: new Date().toISOString()
                    };
                    MOCK_DATA.inventory.push(record);
                }
                saveToDisk();
                return { rows: [record], rowCount: 1 };
            }

            // Enhanced column/value parsing
            const colsPart = text.match(/\((.*?)\)/s);
            const columns = colsPart ? colsPart[1].split(',').map(c => c.trim().toLowerCase()) : [];

            const newRecord: any = { id: String(MOCK_DATA[table].length + 1) };
            columns.forEach((col, index) => {
                if (index < params.length) {
                    newRecord[col] = params[index];
                }
            });

            // Set default fields if missing
            if (newRecord.is_active === undefined && ['products', 'product_categories', 'customers', 'suppliers', 'accounts'].includes(table)) {
                newRecord.is_active = true;
            }
            if (newRecord.branch_id === undefined && table === 'suppliers') {
                newRecord.branch_id = '1';
            }
            newRecord.created_at = new Date().toISOString();

            MOCK_DATA[table].push(newRecord);
            saveToDisk();
            return { rows: [newRecord], rowCount: 1 };
        }
    }

    // Generic UPDATE Parser
    if (query.startsWith('update')) {
        const tableMatch = query.match(/update\s+([a-z0-9_]+)/i);
        if (tableMatch) {
            const table = tableMatch[1];
            if (MOCK_DATA[table]) {
                const idMatch = query.match(/where id\s*=\s*\$([0-9]+)/i);
                if (idMatch) {
                    const paramIndex = parseInt(idMatch[1], 10) - 1;
                    const id = params[paramIndex];
                    const recordIndex = MOCK_DATA[table].findIndex(r => r.id == id);

                    if (recordIndex !== -1) {
                        const setPartMatch = text.match(/set\s+(.*?)\s+where/i);
                        if (setPartMatch) {
                            const setPart = setPartMatch[1];
                            const assignments = setPart.split(',').map(s => s.trim());
                            assignments.forEach((assignment) => {
                                const parts = assignment.split('=');
                                if (parts.length < 2) return;

                                const col = parts[0].trim().toLowerCase();
                                const valExpr = parts[1].trim();

                                const relativeMatch = valExpr.match(/([a-z0-9_]+)\s*([-+])\s*\$([0-9]+)/i);
                                if (relativeMatch) {
                                    const operator = relativeMatch[2];
                                    const paramIdx = parseInt(relativeMatch[3]) - 1;
                                    const val = Number(params[paramIdx]) || 0;

                                    if (operator === '+') {
                                        MOCK_DATA[table][recordIndex][col] = Number(MOCK_DATA[table][recordIndex][col] || 0) + val;
                                    } else {
                                        MOCK_DATA[table][recordIndex][col] = Number(MOCK_DATA[table][recordIndex][col] || 0) - val;
                                    }
                                } else {
                                    const valMatch = valExpr.match(/\$([0-9]+)/);
                                    if (valMatch) {
                                        const valIndex = parseInt(valMatch[1]) - 1;
                                        if (valIndex < params.length) {
                                            MOCK_DATA[table][recordIndex][col] = params[valIndex];
                                        }
                                    }
                                }
                            });
                            MOCK_DATA[table][recordIndex].updated_at = new Date().toISOString();
                            saveToDisk();
                            return { rows: [MOCK_DATA[table][recordIndex]], rowCount: 1 };
                        }
                    }
                } else if (query.includes('last_login = current_timestamp')) {
                    return { rows: [], rowCount: 1 };
                }
            }
        }
    }

    // Generic DELETE Parser
    if (query.startsWith('delete from')) {
        const tableMatch = query.match(/delete from\s+([a-z0-9_]+)/i);
        if (tableMatch) {
            const table = tableMatch[1];
            if (MOCK_DATA[table]) {
                const idMatch = query.match(/where id\s*=\s*\$([0-9]+)/i);
                if (idMatch) {
                    const paramIndex = parseInt(idMatch[1], 10) - 1;
                    const id = params[paramIndex];
                    const initialLength = MOCK_DATA[table].length;
                    MOCK_DATA[table] = MOCK_DATA[table].filter(r => r.id != id);
                    saveToDisk();
                    return { rows: [], rowCount: initialLength - MOCK_DATA[table].length };
                }
                const poMatch = query.match(/where purchase_order_id\s*=\s*\$([0-9]+)/i);
                if (poMatch && table === 'purchase_order_items') {
                    const paramIndex = parseInt(poMatch[1], 10) - 1;
                    const poId = params[paramIndex];
                    const initialLength = MOCK_DATA[table].length;
                    MOCK_DATA[table] = MOCK_DATA[table].filter(r => r.purchase_order_id != poId);
                    saveToDisk();
                    return { rows: [], rowCount: initialLength - MOCK_DATA[table].length };
                }
            }
        }
    }

    // 1. SELECT NOW()
    if (query.includes('select now()')) {
        return { rows: [{ now: new Date().toISOString() }], rowCount: 1 };
    }

    // 2. Dashboard Stats
    if (query.includes('sum(total_amount) as total from sales_orders')) {
        const total = MOCK_DATA.sales_orders
            .filter(o => o.status === 'Completed')
            .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        return { rows: [{ total }], rowCount: 1 };
    }

    if (query.includes('count(*) as count from sales_orders')) {
        return { rows: [{ count: MOCK_DATA.sales_orders.length }], rowCount: 1 };
    }

    if (query.includes('count(*) as count from products')) {
        return { rows: [{ count: MOCK_DATA.products.length }], rowCount: 1 };
    }

    if (query.includes('count(*) as count from employees')) {
        return { rows: [{ count: MOCK_DATA.employees.length }], rowCount: 1 };
    }

    // 3. Joins
    if (query.includes('from sales_orders so') && query.includes('left join customers c')) {
        const orders = MOCK_DATA.sales_orders.map(o => {
            const customer = MOCK_DATA.customers.find(c => c.id == o.customer_id);
            return {
                ...o,
                customer_name: customer ? customer.name : 'Unknown'
            };
        });
        return { rows: orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), rowCount: orders.length };
    }

    // 4. Products query with Category Join
    if (query.includes('from products') && !query.includes('from inventory')) {
        const products = MOCK_DATA.products.map(p => {
            const cat = MOCK_DATA.product_categories?.find(c => c.id == p.category_id);
            const invRecord = MOCK_DATA.inventory.find(i => i.product_id == p.id);
            return {
                ...p,
                category_name: cat ? cat.name : null,
                quantity: invRecord ? Number(invRecord.quantity) : (Number(p.quantity) || Number(p.stock) || 0)
            };
        });
        return { rows: products, rowCount: products.length };
    }

    // 4.1 Inventory JOIN query
    if (query.includes('from inventory') && query.includes('join')) {
        const enriched = MOCK_DATA.inventory.map(inv => {
            const product = MOCK_DATA.products.find(p => p.id == inv.product_id);
            const branch = MOCK_DATA.branches.find(b => b.id == inv.branch_id);
            return {
                ...inv,
                product_name: product ? product.name : 'Unknown',
                sku: product ? product.sku : '-',
                min_stock_level: product ? (product.min_stock_level || 0) : 0,
                branch_name: branch ? branch.name : 'Main',
            };
        });
        return { rows: enriched, rowCount: enriched.length };
    }

    // 5. Auth
    if (query.includes('from users') && (query.includes('email = $1') || query.includes('email=$1'))) {
        const email = params[0]?.toLowerCase();
        const user = MOCK_DATA.users.find(u => u.email.toLowerCase() === email);
        if (user) {
            const role = MOCK_DATA.roles.find(r => r.id == user.role_id);
            return { rows: [{ ...user, role_name: role ? role.name : 'User' }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // 6. User by ID
    if (query.includes('from users') && (query.includes('id = $1') || query.includes('id=$1'))) {
        const id = params[0];
        const user = MOCK_DATA.users.find(u => u.id == id);
        if (user) {
            const role = MOCK_DATA.roles.find(r => r.id == user.role_id);
            return { rows: [{ ...user, role_name: role ? role.name : 'User' }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    // 7. Permissions
    if (query.includes('permissions') && query.includes('role_permissions')) {
        const roleId = params[0];
        const perms = MOCK_DATA.role_permissions
            .filter(rp => rp.role_id == roleId)
            .map(rp => ({ name: MOCK_DATA.permissions.find(p => p.id == rp.permission_id)?.name }));
        return { rows: perms, rowCount: perms.length };
    }

    // Fallback Table Fetch
    const fromSimpleMatch = query.match(/from\s+([a-z0-9_]+)/i);
    if (fromSimpleMatch) {
        const table = fromSimpleMatch[1];
        if (MOCK_DATA[table]) {
            let results = [...MOCK_DATA[table]];
            const whereMatch = query.match(/where\s+([a-z0-9_]+)\s*=\s*\$([0-9]+)/i);
            if (whereMatch) {
                const col = whereMatch[1].toLowerCase();
                const paramIdx = parseInt(whereMatch[2]) - 1;
                const val = params[paramIdx];
                results = results.filter(r => String(r[col]) == String(val));
            }
            return { rows: results, rowCount: results.length };
        }
    }

    return { rows: [], rowCount: 0 };
};
