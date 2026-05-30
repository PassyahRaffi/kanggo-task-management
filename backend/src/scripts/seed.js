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
      'user@taskflow.test',
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
      { name: 'admin',  email: 'admin@taskflow.test',  role: 'admin' },
      { name: 'lorem',  email: 'lorem@taskflow.test',  role: 'user'  },
      { name: 'ipsum',  email: 'ipsum@taskflow.test',  role: 'user'  },
    ];

    for (const u of seedUsers) {
      await conn.execute(
        `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role)`,
        [u.name, u.email, pwd, u.role]
      );
    }

    // Remove old user account if it exists
    await conn.execute("DELETE FROM users WHERE email = 'user@taskflow.test'");

    const [uRows] = await conn.execute(
      "SELECT id, email FROM users WHERE email IN ('admin@taskflow.test', 'lorem@taskflow.test', 'ipsum@taskflow.test')"
    );
    const uMap = Object.fromEntries(uRows.map((u) => [u.email, u.id]));

    const adminId  = uMap['admin@taskflow.test'];
    const loremId  = uMap['lorem@taskflow.test'];
    const ipsumId  = uMap['ipsum@taskflow.test'];

    console.log('✓ Users');

    // ── 2. TASKS ──────────────────────────────────────────────────────
    const TASKS = [
      // ── Done — assigned to lorem (7) ──
      { title: 'Setup authentication middleware',      desc: 'Implement JWT middleware and protect all task routes with bearer token validation.',          status: 'done',        dl: '2026-05-10', owner: adminId, assignee: loremId },
      { title: 'Complete README API documentation',    desc: 'Document all API endpoints, env variables, Docker setup, and local development steps.',      status: 'done',        dl: '2026-05-12', owner: adminId, assignee: loremId },
      { title: 'Implement task pagination',            desc: 'Add page-based pagination to the task list endpoint with total count and page metadata.',     status: 'done',        dl: '2026-05-14', owner: adminId, assignee: loremId },
      { title: 'Add title search feature',             desc: 'Allow users to search tasks by keyword using a partial match query on the title field.',      status: 'done',        dl: '2026-05-15', owner: adminId, assignee: loremId },
      { title: 'Write unit tests for auth',            desc: 'Cover register and login endpoints with Jest and Supertest integration tests.',               status: 'done',        dl: '2026-05-16', owner: adminId, assignee: loremId },
      { title: 'Fix overdue date highlight bug',       desc: 'Overdue indicator was not showing on tasks due today due to timezone offset issue.',          status: 'done',        dl: '2026-05-17', owner: adminId, assignee: loremId },
      { title: 'Add confirm dialog for delete',        desc: 'Show a confirmation modal before permanently deleting a task to prevent accidental removal.', status: 'done',        dl: '2026-05-18', owner: adminId, assignee: loremId },
      // ── Done — assigned to ipsum (7) ──
      { title: 'Kanban board drag and drop',           desc: 'Allow users to drag task cards between status columns and persist the status change.',        status: 'done',        dl: '2026-05-19', owner: adminId, assignee: ipsumId },
      { title: 'Implement role-based access control',  desc: 'Restrict task creation to admin role and scope task visibility by ownership and assignment.', status: 'done',        dl: '2026-05-20', owner: adminId, assignee: ipsumId },
      { title: 'Add task attachment URL support',      desc: 'Allow attaching an external URL to a task and preview image attachments inside the modal.',   status: 'done',        dl: '2026-05-21', owner: adminId, assignee: ipsumId },
      { title: 'Refactor API response format',         desc: 'Standardize all API responses to use { success, message, data } envelope structure.',         status: 'done',        dl: '2026-05-22', owner: adminId, assignee: ipsumId },
      { title: 'Add comment section to task detail',   desc: 'Enable users to add, edit, and delete comments on individual tasks with timestamps.',         status: 'done',        dl: '2026-05-23', owner: adminId, assignee: ipsumId },
      { title: 'Implement activity timeline',          desc: 'Log and display all task events (create, update, assign, status change) in a timeline view.',  status: 'done',        dl: '2026-05-24', owner: adminId, assignee: ipsumId },
      { title: 'API rate limiting setup',              desc: 'Configure express-rate-limit to prevent brute-force attacks on auth and task endpoints.',      status: 'done',        dl: '2026-05-26', owner: adminId, assignee: ipsumId },
      // ── In Progress — assigned to lorem (5) ──
      { title: 'Improve frontend error message',       desc: 'Make frontend error messages clearer and provide actionable guidance for common failures.',    status: 'in-progress', dl: '2026-06-03', owner: adminId, assignee: loremId },
      { title: 'Optimize database queries',            desc: 'Add composite indexes and rewrite N+1 queries in the task list and activity log endpoints.',   status: 'in-progress', dl: '2026-06-05', owner: adminId, assignee: loremId },
      { title: 'Fix mobile responsive layout',         desc: 'Fix Kanban card grid breaking on screens below 375px and add horizontal scroll for columns.',  status: 'in-progress', dl: '2026-06-07', owner: adminId, assignee: loremId },
      { title: 'Security audit and input sanitize',    desc: 'Review all endpoints for SQL injection, XSS, and missing validation rules.',                  status: 'in-progress', dl: '2026-06-08', owner: adminId, assignee: loremId },
      { title: 'User acceptance testing round 1',      desc: 'Run UAT session with three internal testers and collect structured feedback on all features.', status: 'in-progress', dl: '2026-06-10', owner: adminId, assignee: loremId },
      // ── In Progress — assigned to ipsum (5) ──
      { title: 'Performance optimization frontend',    desc: 'Reduce initial bundle size using code splitting, lazy loading, and image optimization.',       status: 'in-progress', dl: '2026-06-12', owner: adminId, assignee: ipsumId },
      { title: 'Database migration scripts',           desc: 'Write versioned migration scripts for schema changes and test rollback procedures.',           status: 'in-progress', dl: '2026-06-14', owner: adminId, assignee: ipsumId },
      { title: 'Add advanced filter panel',            desc: 'Implement multi-criteria filter by status, deadline range, assignee, and keyword combined.',   status: 'in-progress', dl: '2026-06-16', owner: adminId, assignee: ipsumId },
      { title: 'Fix timezone handling in deadlines',   desc: 'Deadline dates shifting by one day for users in UTC+8 timezone — investigate and patch.',      status: 'in-progress', dl: '2026-06-18', owner: adminId, assignee: ipsumId },
      { title: 'Implement drag order persistence',     desc: 'Persist card sort_order after within-column drag so the order survives a page refresh.',       status: 'in-progress', dl: '2026-06-20', owner: adminId, assignee: ipsumId },
      // ── Pending — assigned to lorem (6) ──
      { title: 'Fix task filter by status',            desc: 'Ensure status filter works correctly for all three values: pending, in-progress, and done.',   status: 'pending',     dl: '2026-06-22', owner: adminId, assignee: loremId },
      { title: 'Add loading skeleton to task list',    desc: 'Replace plain loading spinner with skeleton card components that match the real card layout.',  status: 'pending',     dl: '2026-06-23', owner: adminId, assignee: loremId },
      { title: 'Review and merge open PRs',            desc: 'Review five open pull requests, leave feedback, and merge approved branches to main.',         status: 'pending',     dl: '2026-06-24', owner: adminId, assignee: loremId },
      { title: 'Update npm dependencies',              desc: 'Run npm audit, update all outdated packages to latest minor versions, and test regressions.',   status: 'pending',     dl: '2026-06-25', owner: adminId, assignee: loremId },
      { title: 'Setup CI/CD pipeline',                 desc: 'Configure GitHub Actions to run lint, tests, and Docker build on every push to main branch.',  status: 'pending',     dl: '2026-06-26', owner: adminId, assignee: loremId },
      { title: 'Create Postman collection',            desc: 'Export all API endpoints to a shareable Postman collection with pre-filled example payloads.',  status: 'pending',     dl: '2026-06-27', owner: adminId, assignee: loremId },
      // ── Pending — assigned to ipsum (5) ──
      { title: 'Deploy backend to Railway',            desc: 'Deploy Express API and MySQL database to Railway and verify all endpoints on production URL.',  status: 'pending',     dl: '2026-06-28', owner: adminId, assignee: ipsumId },
      { title: 'Add export to CSV feature',            desc: 'Allow admin to export the full task list to a downloadable CSV file with all metadata fields.', status: 'pending',     dl: '2026-06-29', owner: adminId, assignee: ipsumId },
      { title: 'Write API integration tests',          desc: 'Cover all CRUD endpoints with Supertest integration tests using a test database.',             status: 'pending',     dl: '2026-06-30', owner: adminId, assignee: ipsumId },
      { title: 'Setup logging and monitoring',         desc: 'Integrate Winston for structured logging and add a health check endpoint for uptime monitoring.',status: 'pending',     dl: '2026-07-02', owner: adminId, assignee: ipsumId },
      { title: 'User acceptance testing round 2',      desc: 'Second UAT round incorporating fixes from round 1 feedback with five external testers.',       status: 'pending',     dl: '2026-07-05', owner: adminId, assignee: ipsumId },
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
    console.log('  lorem@taskflow.test   → user');
    console.log('  ipsum@taskflow.test   → user');
    console.log('  (any registered account) → user  (default role)');
    console.log('─────────────────────────────────────────────────────────────────\n');

  } finally {
    await conn.end();
  }
}

seed().catch((err) => { console.error('\n❌ Seed failed:', err.message || err); console.error(err); process.exit(1); });
