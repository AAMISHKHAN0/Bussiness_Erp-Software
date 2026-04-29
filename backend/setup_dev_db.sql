-- Setup Global Master Database
-- Run this as 'postgres' user
CREATE DATABASE erp_master;

\c erp_master;

-- Companies / Tenants table
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

-- Seed Initial Development Tenant
TRUNCATE companies CASCADE;
INSERT INTO companies (name, slug, db_name, encrypted_password)
VALUES (
    'Company One', 
    'company1', 
    'erp_tenant_company1', 
    '37b85e9a4f4c48511d5cf3ef4:6eef4006eef0ac44209ece94b4f4c48511'
),
(
    'Mock Default System', 
    'mock-default', 
    'erp_tenant_company1', 
    'da3f66eb5fb9a03e4b8b7c9010202f37:b5b89af673bfe8637a29fa9fe7ed7a30'
);

-- Setup Individual Tenant Database
CREATE DATABASE erp_tenant_company1;

\c erp_tenant_company1;

-- Users table (Tenant-specific)
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

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '[]'
);

TRUNCATE roles CASCADE;
INSERT INTO roles (name, permissions) VALUES ('Super Admin', '["*"]');

-- Standard Branches table
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address TEXT
);

TRUNCATE branches CASCADE;
INSERT INTO branches (name) VALUES ('Main Headquarters');

-- Default Admin for company1
-- Email: admin@company.com
-- Password: password123 (bcrypt hash)
TRUNCATE users CASCADE;
INSERT INTO users (email, password_hash, first_name, last_name, role_id, branch_id)
SELECT 'admin@company.com', '$2a$10$QG4OBpu3NDYtLi4v6lPR8uZ.wB.cY71dYePGypGzW19RyYAM66BH.', 'Super', 'Admin', r.id, b.id
FROM roles r, branches b
WHERE r.name = 'Super Admin' AND b.name = 'Main Headquarters'
LIMIT 1;
