import { masterPool, masterQuery } from './db';
import { logger } from '../utils/logger';

/**
 * Ensures all required database tables exist.
 * Runs on every server startup — safe to call multiple times (uses IF NOT EXISTS).
 */
export const initializeDatabase = async (): Promise<boolean> => {
    try {
        logger.info('🔧 Checking database tables...');

        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS companies (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                db_name VARCHAR(100) NOT NULL,
                db_host VARCHAR(100) NOT NULL DEFAULT 'localhost',
                db_user VARCHAR(100) NOT NULL DEFAULT 'postgres',
                encrypted_password TEXT NOT NULL,
                plan VARCHAR(50) NOT NULL DEFAULT 'standard',
                status VARCHAR(20) NOT NULL DEFAULT 'active',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                role_id UUID,
                branch_id UUID,
                phone VARCHAR(50),
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                permissions JSONB DEFAULT '[]'
            );
        `);

        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS branches (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                address TEXT
            );
        `);

        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                address TEXT,
                city VARCHAR(100),
                country VARCHAR(100),
                company VARCHAR(255),
                notes TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                sku VARCHAR(100),
                description TEXT,
                price DECIMAL(12,2) DEFAULT 0,
                cost DECIMAL(12,2) DEFAULT 0,
                stock_quantity INTEGER DEFAULT 0,
                category VARCHAR(100),
                unit VARCHAR(50) DEFAULT 'pcs',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Safely add min_stock_level to existing products table
        await masterPool.query(`
            ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 10;
        `);

        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID REFERENCES products(id) ON DELETE CASCADE,
                quantity INTEGER DEFAULT 0,
                location VARCHAR(100),
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS sales_orders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_number VARCHAR(50) UNIQUE NOT NULL,
                customer_id UUID REFERENCES customers(id),
                status VARCHAR(50) DEFAULT 'Pending',
                total_amount DECIMAL(12,2) DEFAULT 0,
                order_date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                po_number VARCHAR(50) UNIQUE NOT NULL,
                status VARCHAR(50) DEFAULT 'Pending',
                total_amount DECIMAL(12,2) DEFAULT 0,
                order_date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE,
                department VARCHAR(100),
                position VARCHAR(100),
                salary DECIMAL(12,2) DEFAULT 0,
                hire_date DATE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS invoices (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                invoice_number VARCHAR(50) UNIQUE NOT NULL,
                customer_id UUID REFERENCES customers(id),
                status VARCHAR(20) DEFAULT 'draft',
                subtotal DECIMAL(12,2) DEFAULT 0,
                tax DECIMAL(12,2) DEFAULT 0,
                discount DECIMAL(12,2) DEFAULT 0,
                total DECIMAL(12,2) DEFAULT 0,
                notes TEXT,
                due_date DATE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS invoice_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
                product_id UUID REFERENCES products(id),
                description TEXT,
                quantity INTEGER DEFAULT 1,
                unit_price DECIMAL(12,2) DEFAULT 0,
                total DECIMAL(12,2) DEFAULT 0
            );
        `);

        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS expenses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                description TEXT NOT NULL,
                amount DECIMAL(12,2) NOT NULL,
                category VARCHAR(100),
                date DATE DEFAULT CURRENT_DATE,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Additional Missing Tables
        await masterPool.query(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                company_name VARCHAR(255),
                contact_person VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                address TEXT,
                city VARCHAR(100),
                country VARCHAR(100),
                tax_id VARCHAR(100),
                payment_terms VARCHAR(100),
                notes TEXT,
                branch_id UUID,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS product_categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                parent_id UUID,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sales_order_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
                product_id UUID REFERENCES products(id),
                quantity INTEGER DEFAULT 1,
                unit_price DECIMAL(12,2) DEFAULT 0,
                total DECIMAL(12,2) DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(100) NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100),
                category VARCHAR(100),
                parent_id UUID,
                description TEXT,
                balance DECIMAL(12,2) DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS journal_entries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                entry_date DATE NOT NULL,
                reference_number VARCHAR(255),
                description TEXT,
                total_amount DECIMAL(12,2),
                created_by UUID,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS journal_entry_lines (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
                account_id UUID REFERENCES accounts(id),
                debit_amount DECIMAL(12,2) DEFAULT 0,
                credit_amount DECIMAL(12,2) DEFAULT 0,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                transaction_date DATE NOT NULL,
                description TEXT,
                amount DECIMAL(12,2),
                account_id UUID REFERENCES accounts(id),
                type VARCHAR(50),
                reference_type VARCHAR(100),
                reference_id UUID,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID,
                action VARCHAR(255),
                entity VARCHAR(255),
                entity_id UUID,
                details JSONB,
                ip_address VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS attendance (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employee_id UUID REFERENCES employees(id),
                date DATE NOT NULL,
                status VARCHAR(50),
                check_in TIMESTAMP WITH TIME ZONE,
                check_out TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS payroll (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employee_id UUID REFERENCES employees(id),
                month VARCHAR(20),
                year INTEGER,
                basic_salary DECIMAL(12,2) DEFAULT 0,
                allowances DECIMAL(12,2) DEFAULT 0,
                deductions DECIMAL(12,2) DEFAULT 0,
                net_salary DECIMAL(12,2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'Pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create Views for Reports
        await masterPool.query(`
            CREATE OR REPLACE VIEW sales_trends AS
            SELECT 
                DATE_TRUNC('month', order_date) as month,
                SUM(total_amount) as total_sales
            FROM sales_orders
            GROUP BY DATE_TRUNC('month', order_date);

            CREATE OR REPLACE VIEW inventory_summaries AS
            SELECT 
                p.category,
                SUM(i.quantity) as total_quantity,
                SUM(i.quantity * p.price) as total_value
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id
            GROUP BY p.category;
        `);

        // ─── Seed default data if missing ───
        // Default role
        const roleCheck = await masterPool.query(`SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1`);
        if (roleCheck.rows.length === 0) {
            await masterPool.query(`INSERT INTO roles (name, permissions) VALUES ('Super Admin', '["*"]')`);
            logger.info('  ✅ Created default Super Admin role');
        }

        // Default branch
        const branchCheck = await masterPool.query(`SELECT id FROM branches WHERE name = 'Main Headquarters' LIMIT 1`);
        if (branchCheck.rows.length === 0) {
            await masterPool.query(`INSERT INTO branches (name, address) VALUES ('Main Headquarters', 'Head Office')`);
            logger.info('  ✅ Created default branch');
        }

        // Default tenant for IP-based access
        const tenantCheck = await masterPool.query(`SELECT id FROM companies WHERE slug = 'default' LIMIT 1`);
        if (tenantCheck.rows.length === 0) {
            const { env } = await import('./env.js');
            await masterPool.query(`
                INSERT INTO companies (name, slug, db_name, db_host, db_user, encrypted_password, plan, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                'Default Company', 
                'default', 
                env.db.name, 
                'postgres', // In docker network
                env.db.user, 
                env.db.password, 
                'enterprise',
                'active'
            ]);
            logger.info('  ✅ Created default tenant');
        } else {
            // FORCE update host for existing 'default' tenant to fix stale Supabase connections
            await masterPool.query(`
                UPDATE companies 
                SET db_host = 'postgres' 
                WHERE slug = 'default' AND db_host LIKE '%supabase.co%'
            `);
            logger.info('  ✅ Verified/Fixed default tenant host');
        }

        // Default admin user
        const userCheck = await masterPool.query(`SELECT id FROM users WHERE email = 'admin@company.com' LIMIT 1`);
        if (userCheck.rows.length === 0) {
            const roleResult = await masterPool.query(`SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1`);
            const branchResult = await masterPool.query(`SELECT id FROM branches WHERE name = 'Main Headquarters' LIMIT 1`);
            const roleId = roleResult.rows[0]?.id || null;
            const branchId = branchResult.rows[0]?.id || null;

            await masterPool.query(`
                INSERT INTO users (email, password_hash, first_name, last_name, role_id, branch_id)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                'admin@company.com',
                '$2a$10$QG4OBpu3NDYtLi4v6lPR8uZ.wB.cY71dYePGypGzW19RyYAM66BH.',
                'Super',
                'Admin',
                roleId,
                branchId
            ]);
            logger.info('  ✅ Created default admin user (admin@company.com / password123)');
        }

        logger.info('✅ Database initialization complete');
        return true;

    } catch (error: any) {
        console.error("FULL DB INIT ERROR:", error);
        logger.error('❌ Database initialization failed', { error: error.message });
        return false;
    }
};
