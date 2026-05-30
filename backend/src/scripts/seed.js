/**
 * Seed script — idempotent demo data for testing/review.
 * Run: cd backend && npm run seed
 * OR from root: npm run seed
 */

// Load from root .env; fall back to backend/.env for legacy layouts
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');

// When seed runs on the host (outside Docker), 'db' hostname doesn't resolve.
const rawHost = process.env.DB_HOST || 'localhost';
const DB = {
  host:     rawHost === 'db' ? 'localhost' : rawHost,
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const exists = async (conn, table, where, params) => {
  const [[{ c }]] = await conn.execute(`SELECT COUNT(*) AS c FROM ${table} WHERE ${where}`, params);
  return c > 0;
};

async function seed() {
  const conn = await mysql.createConnection(DB);
  console.log('Connected. Seeding…\n');

  try {
    // ── 0. CLEANUP old dummy users (previous seed layout) ─────────────
    const obsoleteEmails = [
      'superadmin@taskflow.test',
      'passyah11@gmail.com',
      'admin.engineering@taskflow.test',
      'user.engineering@taskflow.test',
      'admin.operations@taskflow.test',
      'user.operations@taskflow.test',
      'admin.support@taskflow.test',
      'user.support@taskflow.test',
    ];
    for (const email of obsoleteEmails) {
      await conn.execute('DELETE FROM users WHERE email = ?', [email]);
    }
    console.log('✓ Cleaned up old dummy users');

    // ── 1. USERS ──────────────────────────────────────────────────────
    const pwd = await bcrypt.hash('password123', 12);

    const seedUsers = [
      { name: 'admin',     email: 'admin@taskflow.test', role: 'admin' },
      { name: 'user',      email: 'user@taskflow.test', role: 'user'  },
    ];

    for (const u of seedUsers) {
      await conn.execute(
        `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role)`,
        [u.name, u.email, pwd, u.role]
      );
    }

    const [uRows] = await conn.execute(
      "SELECT id, email FROM users WHERE email IN ('admin@taskflow.test', 'user@taskflow.test')"
    );
    const uMap = Object.fromEntries(uRows.map((u) => [u.email, u.id]));

    const adminId          = uMap['admin@taskflow.test'];
    const registeredUserId = uMap['user@taskflow.test'] || null;

    console.log('✓ Users');

    // ── 2. TASKS ──────────────────────────────────────────────────────
    const TASKS = [
      { title: 'Setup authentication middleware',    desc: 'Implement JWT middleware and protect task routes.',                        status: 'pending',     dl: '2026-06-15', owner: adminId, assignee: registeredUserId },
      { title: 'Fix task filter by status',          desc: 'Ensure status filter works for pending, in-progress, and done.',           status: 'pending',     dl: '2026-06-18', owner: adminId, assignee: registeredUserId },
      { title: 'Improve frontend error message',     desc: 'Make frontend error messages easier to understand.',                       status: 'in-progress', dl: '2026-06-20', owner: adminId, assignee: registeredUserId },
      { title: 'Complete README API documentation',  desc: 'Document all API endpoints, env variables, and local setup steps.',        status: 'done',        dl: '2026-05-30', owner: adminId, assignee: registeredUserId },
      { title: 'Implement task pagination',          desc: 'Add page-based pagination to the task list endpoint.',                     status: 'done',        dl: '2026-05-28', owner: adminId, assignee: registeredUserId },
      { title: 'Add title search feature',           desc: 'Allow users to search tasks by keyword from the task list page.',          status: 'done',        dl: '2026-05-27', owner: adminId, assignee: registeredUserId },
      { title: 'Write unit tests for auth',          desc: 'Cover register and login endpoints with Jest and Supertest.',              status: 'done',        dl: '2026-05-25', owner: adminId, assignee: registeredUserId },
      { title: 'Optimize database queries',          desc: 'Add indexes and review slow queries in task list.',                        status: 'in-progress', dl: '2026-06-10', owner: adminId, assignee: registeredUserId },
      { title: 'Fix mobile responsive layout',       desc: 'Fix card grid breaking on screens below 375px.',                          status: 'in-progress', dl: '2026-06-12', owner: adminId, assignee: registeredUserId },
      { title: 'Add loading skeleton to task list',  desc: 'Replace plain loading text with skeleton card components.',                status: 'pending',     dl: '2026-06-22', owner: adminId, assignee: registeredUserId },
      { title: 'Review and merge open PRs',          desc: 'Review three open pull requests and merge after approval.',               status: 'pending',     dl: '2026-06-17', owner: adminId, assignee: registeredUserId },
      { title: 'Update npm dependencies',            desc: 'Run npm audit and update outdated packages to latest minor versions.',     status: 'pending',     dl: '2026-06-25', owner: adminId, assignee: registeredUserId },
      { title: 'Setup CI/CD pipeline',               desc: 'Configure GitHub Actions to run tests on every push to main.',            status: 'pending',     dl: '2026-06-28', owner: adminId, assignee: registeredUserId },
      { title: 'Security audit and input sanitize',  desc: 'Review all endpoints for injection risks and missing validation.',        status: 'in-progress', dl: '2026-06-08', owner: adminId, assignee: registeredUserId },
      { title: 'Create Postman collection',          desc: 'Export all API endpoints to a shareable Postman collection file.',        status: 'pending',     dl: '2026-06-19', owner: adminId, assignee: registeredUserId },
      { title: 'Fix overdue date highlight bug',     desc: 'Overdue indicator not showing on tasks due today.',                       status: 'done',        dl: '2026-05-22', owner: adminId, assignee: registeredUserId },
      { title: 'Add confirm dialog for delete',      desc: 'Show a confirmation modal before permanently deleting a task.',           status: 'done',        dl: '2026-05-20', owner: adminId, assignee: registeredUserId },
      { title: 'Kanban board drag and drop',         desc: 'Allow users to drag task cards between status columns.',                  status: 'done',        dl: '2026-05-18', owner: adminId, assignee: registeredUserId },
      { title: 'User acceptance testing round 1',    desc: 'Run UAT session with three internal testers and collect feedback.',       status: 'in-progress', dl: '2026-06-05', owner: adminId, assignee: registeredUserId },
      { title: 'Deploy backend to Railway',          desc: 'Deploy Express API and MySQL to Railway for public demo access.',         status: 'pending',     dl: '2026-06-30', owner: adminId, assignee: registeredUserId },
    ];

    const taskIds = {};
    for (const t of TASKS) {
      if (!t.owner) continue;
      const alreadyExists = await exists(conn, 'tasks', 'title = ? AND user_id = ?', [t.title, t.owner]);
      let taskId;
      if (!alreadyExists) {
        const completedAt = t.status === 'done'
          ? new Date(new Date(t.dl).getTime() - 2 * 3600000).toISOString().slice(0, 19).replace('T', ' ')
          : null;
        const [res] = await conn.execute(
          'INSERT INTO tasks (title, description, status, deadline, user_id, assigned_to_user_id, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [t.title, t.desc, t.status, t.dl, t.owner, t.assignee || null, completedAt]
        );
        taskId = res.insertId;
      } else {
        const [[row]] = await conn.execute('SELECT id FROM tasks WHERE title = ? AND user_id = ?', [t.title, t.owner]);
        taskId = row.id;
      }
      taskIds[t.title] = taskId;
    }
    // Initialize sort_order for any tasks that don't have one yet
    await conn.execute('UPDATE tasks SET sort_order = id * 10 WHERE sort_order = 0');
    console.log('✓ Tasks');

    // ── 3. ACTIVITIES ──────────────────────────────────────────────────
    for (const [title, taskId] of Object.entries(taskIds)) {
      const t = TASKS.find((x) => x.title === title);
      if (!t || !t.owner) continue;

      const addAct = async (action, fieldName, oldVal, newVal) => {
        const dup = await exists(conn, 'task_activities', 'task_id = ? AND user_id = ? AND action = ?', [taskId, t.owner, action]);
        if (!dup) await conn.execute(
          'INSERT INTO task_activities (task_id, user_id, action, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
          [taskId, t.owner, action, fieldName || null, oldVal || null, newVal || null]
        );
      };

      await addAct('task_created', null, null, null);
      if (t.assignee) {
        const [[assigneeUser]] = await conn.execute('SELECT name FROM users WHERE id = ?', [t.assignee]);
        await addAct('task_assigned', 'assigned_to', null, assigneeUser?.name || String(t.assignee));
      }
      if (t.status === 'in-progress') await addAct('status_changed', 'status', 'pending', 'in-progress');
      if (t.status === 'done') {
        await addAct('status_changed', 'status', 'pending', 'done');
        await addAct('task_completed', null, null, null);
      }
    }
    console.log('✓ Activities');

    console.log('\n✅ Seed completed!\n');
    console.log('Demo credentials (password: password123)');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('  admin@taskflow.test   → admin');
    console.log('  user@taskflow.test    → user');
    console.log('  (any registered account) → user  (default role)');
    console.log('─────────────────────────────────────────────────────────────────\n');

  } finally {
    await conn.end();
  }
}

seed().catch((err) => { console.error('\n❌ Seed failed:', err.message || err); console.error(err); process.exit(1); });
