-- schema_migration.sql
-- Run this ONLY if you already have the database from the previous version (users + tasks only).
-- If you are setting up fresh, use schema.sql instead.
-- WARNING: Run once. ALTER TABLE will error if columns already exist (safe to ignore).

USE kanggo_tasks;

-- 1. Create divisions table
CREATE TABLE IF NOT EXISTS divisions (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Add role and division_id to users
ALTER TABLE users
  ADD COLUMN role        ENUM('super_admin', 'admin', 'user') NOT NULL DEFAULT 'user',
  ADD COLUMN division_id INT NULL,
  ADD CONSTRAINT fk_users_division FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL;

-- 3. Add division_id to tasks
ALTER TABLE tasks
  ADD COLUMN division_id INT NULL,
  ADD CONSTRAINT fk_tasks_division FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_division ON users(division_id);
CREATE INDEX IF NOT EXISTS idx_tasks_division ON tasks(division_id);
