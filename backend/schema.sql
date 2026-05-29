-- Task Management System — Schema v3
-- Run: mysql -u root -p < backend/schema.sql

CREATE DATABASE IF NOT EXISTS kanggo_tasks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kanggo_tasks;

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('admin','user') NOT NULL DEFAULT 'user',
  division_id INT           NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. tasks
CREATE TABLE IF NOT EXISTS tasks (
  id                   INT           AUTO_INCREMENT PRIMARY KEY,
  title                VARCHAR(255)  NOT NULL,
  description          TEXT,
  status               ENUM('pending','in-progress','done') NOT NULL DEFAULT 'pending',
  deadline             DATE,
  user_id              INT           NOT NULL,
  assigned_to_user_id  INT           NULL,
  division_id          INT           NULL,
  attachment_url       TEXT          NULL,
  completed_at         TIMESTAMP     NULL,
  created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_user     FOREIGN KEY (user_id)             REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assignee FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. task_activities
CREATE TABLE IF NOT EXISTS task_activities (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  task_id     INT           NOT NULL,
  user_id     INT           NOT NULL,
  action      VARCHAR(50)   NOT NULL,
  field_name  VARCHAR(100)  NULL,
  old_value   TEXT          NULL,
  new_value   TEXT          NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activities_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_activities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. task_comments
CREATE TABLE IF NOT EXISTS task_comments (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  task_id     INT           NOT NULL,
  user_id     INT           NOT NULL,
  comment     TEXT          NOT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_tasks_user_id   ON tasks(user_id);
CREATE INDEX idx_tasks_assignee  ON tasks(assigned_to_user_id);
CREATE INDEX idx_tasks_status    ON tasks(status);
CREATE INDEX idx_activities_task ON task_activities(task_id);
CREATE INDEX idx_comments_task   ON task_comments(task_id);
