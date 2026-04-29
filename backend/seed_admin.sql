TRUNCATE users CASCADE;
INSERT INTO users (email, password_hash, first_name, last_name, is_active)
VALUES ('admin@company.com', '$2a$10$QG4OBpu3NDYtLi4v6lPR8uZ.wB.cY71dYePGypGzW19RyYAM66BH.', 'Super', 'Admin', true);
