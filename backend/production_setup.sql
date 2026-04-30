-- SUPABASE / SINGLE DATABASE SETUP
-- Run this in your Supabase SQL Editor

-- 1. Create Companies table (Master Tenant Registry)
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

-- 2. Seed Initial Tenant (Point it to the same 'postgres' database for now)
-- Replace the encrypted_password if you have a specific one, or use this dummy one.
INSERT INTO companies (name, slug, db_name, db_host, db_user, encrypted_password)
VALUES (
    'Main System', 
    'default', 
    'postgres', 
    'db.xykovqhovnaxhubltyfc.supabase.co', 
    'postgres', 
    '37b85e9a4f4c48511d5cf3ef4:6eef4006eef0ac44209ece94b4f4c48511'
) ON CONFLICT (slug) DO NOTHING;

-- 3. Create core tables in the SAME database
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id UUID,
    branch_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address TEXT
);

-- 4. Seed Roles and Branches
INSERT INTO roles (name, permissions) VALUES ('Super Admin', '["*"]') ON CONFLICT DO NOTHING;
INSERT INTO branches (name) VALUES ('Main Headquarters') ON CONFLICT DO NOTHING;

-- 5. Seed Default Admin
-- Email: admin@company.com | Password: password123
INSERT INTO users (email, password_hash, first_name, last_name, role_id, branch_id)
SELECT 'admin@company.com', '$2a$10$QG4OBpu3NDYtLi4v6lPR8uZ.wB.cY71dYePGypGzW19RyYAM66BH.', 'Super', 'Admin', r.id, b.id
FROM roles r, branches b
WHERE r.name = 'Super Admin' AND b.name = 'Main Headquarters'
ON CONFLICT (email) DO NOTHING;
