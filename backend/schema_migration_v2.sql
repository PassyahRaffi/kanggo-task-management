-- schema_migration_v2.sql
-- Run ONLY if you already have the v1 database (divisions + users with role + tasks with division_id).
-- Fresh installs: use schema.sql instead.
-- Run once. Some ALTER statements may error if columns already exist — safe to ignore.

USE kanggo_tasks;

-- 1. Add new columns to tasks
ALTER TABLE tasks
  ADD COLUMN assigned_to_user_id INT NULL,
  ADD COLUMN attachment_url      TEXT NULL,
  ADD COLUMN completed_at        TIMESTAMP NULL,
  ADD CONSTRAINT fk_tasks_assignee FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assigned_to_user_id);

-- 2. task_activities
CREATE TABLE IF NOT EXISTS task_activities (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  task_id    INT          NOT NULL,
  user_id    INT          NOT NULL,
  action     VARCHAR(50)  NOT NULL,
  field_name VARCHAR(100) NULL,
  old_value  TEXT         NULL,
  new_value  TEXT         NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activities_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_activities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activities_task ON task_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON task_activities(user_id);

-- 3. task_comments
CREATE TABLE IF NOT EXISTS task_comments (
  id         INT       AUTO_INCREMENT PRIMARY KEY,
  task_id    INT       NOT NULL,
  user_id    INT       NOT NULL,
  comment    TEXT      NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_task ON task_comments(task_id);

-- 4. notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  task_id    INT          NULL,
  type       VARCHAR(50)  NOT NULL,
  title      VARCHAR(255) NOT NULL,
  message    TEXT         NOT NULL,
  is_read    BOOLEAN      DEFAULT FALSE,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notif_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_task      ON notifications(task_id);
