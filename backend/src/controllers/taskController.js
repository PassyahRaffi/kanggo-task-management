const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { logActivity } = require('../utils/activityHelper');

const VALID_STATUSES = ['pending', 'in-progress', 'done'];

const enrichTask = (task) => ({ ...task });

const buildVisibilityClause = (role, userId) => {
  if (role === 'admin') return { clause: '', params: [] };
  return { clause: ' AND (t.user_id = ? OR t.assigned_to_user_id = ?)', params: [userId, userId] };
};

const TASK_SELECT = `
  SELECT t.id, t.title, t.description, t.status, t.deadline,
    t.user_id, t.assigned_to_user_id, t.division_id, t.attachment_url,
    t.sort_order, t.completed_at, t.created_at, t.updated_at,
    u.name  AS creator_name,
    au.name AS assignee_name
  FROM tasks t
  LEFT JOIN users u  ON u.id  = t.user_id
  LEFT JOIN users au ON au.id = t.assigned_to_user_id
`;

// ── GET /api/tasks ────────────────────────────────────────────────
const getTasks = async (req, res, next) => {
  try {
    const { id: userId, role, division_id: divisionId } = req.user;
    const { status, search, page, limit: limitParam, deadline: deadlineFilter, assigned: assignedFilter } = req.query;

    const { clause, params } = buildVisibilityClause(role, userId);
    let whereExtra = '';

    if (status && VALID_STATUSES.includes(status)) { whereExtra += ' AND t.status = ?'; params.push(status); }
    if (search?.trim()) { whereExtra += ' AND t.title LIKE ?'; params.push(`%${search.trim()}%`); }

    if (deadlineFilter === 'overdue') {
      whereExtra += " AND t.deadline < CURDATE() AND t.status != 'done'";
    } else if (deadlineFilter === 'this_week') {
      whereExtra += ' AND t.deadline BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)';
    } else if (deadlineFilter === 'no_deadline') {
      whereExtra += ' AND t.deadline IS NULL';
    }

    if (assignedFilter === 'assigned') {
      whereExtra += ' AND t.assigned_to_user_id IS NOT NULL';
    } else if (assignedFilter === 'unassigned') {
      whereExtra += ' AND t.assigned_to_user_id IS NULL';
    } else if (assignedFilter === 'me') {
      whereExtra += ' AND t.assigned_to_user_id = ?'; params.push(userId);
    }

    const where = ' WHERE 1=1' + clause + whereExtra;

    // Paginated response when ?page= is provided (list view)
    if (page !== undefined) {
      const pageNum  = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 9));
      const offset   = (pageNum - 1) * limitNum;

      const [[{ total }]] = await pool.execute(
        `SELECT COUNT(*) AS total FROM tasks t${where}`, params
      );

      const [tasks] = await pool.execute(
        TASK_SELECT + where + ` ORDER BY t.sort_order ASC, t.id ASC LIMIT ${limitNum} OFFSET ${offset}`,
        params
      );

      return success(res, 200, 'Tasks retrieved successfully', {
        tasks: tasks.map(enrichTask),
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      });
    }

    // Flat array — used by board view
    const [tasks] = await pool.execute(TASK_SELECT + where + ' ORDER BY t.sort_order ASC, t.id ASC', params);
    return success(res, 200, 'Tasks retrieved successfully', tasks.map(enrichTask));
  } catch (err) {
    next(err);
  }
};

// ── POST /api/tasks ───────────────────────────────────────────────
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 422, errors.array()[0].msg, errors.array().map((e) => ({ field: e.path, message: e.msg })));
    }

    const { id: userId, role, division_id: divisionId } = req.user;

    if (role !== 'admin') {
      return error(res, 403, 'Only admin can create tasks');
    }
    const { title, description, status = 'pending', deadline, assigned_to_user_id, attachment_url } = req.body;

    const [[{ nextOrder }]] = await pool.execute(
      'SELECT COALESCE(MIN(sort_order), 10) - 10 AS nextOrder FROM tasks'
    );

    const [result] = await pool.execute(
      `INSERT INTO tasks (title, description, status, deadline, user_id, assigned_to_user_id, attachment_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description || null, status, deadline || null, userId,
       assigned_to_user_id || null, attachment_url || null, nextOrder]
    );

    const [[task]] = await pool.execute(TASK_SELECT + ' WHERE t.id = ?', [result.insertId]);

    await logActivity({ taskId: task.id, userId, action: 'task_created' });

    if (assigned_to_user_id) {
      const [[assignee]] = await pool.execute('SELECT name FROM users WHERE id = ?', [assigned_to_user_id]);
      await logActivity({ taskId: task.id, userId, action: 'task_assigned',
        newValue: assignee?.name || String(assigned_to_user_id) });
    }

    return success(res, 201, 'Task created successfully', enrichTask(task));
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/tasks/:id ────────────────────────────────────────────
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 422, errors.array()[0].msg, errors.array().map((e) => ({ field: e.path, message: e.msg })));
    }

    const { id: userId, role, division_id: divisionId } = req.user;
    const { id } = req.params;

    // Fetch current task with visibility check
    const { clause, params: vParams } = buildVisibilityClause(role, userId);
    const [[current]] = await pool.execute(TASK_SELECT + ` WHERE t.id = ?${clause}`, [id, ...vParams]);
    if (!current) return error(res, 404, 'Task not found');

    const { title, description, status, deadline, assigned_to_user_id, attachment_url } = req.body;
    const setClauses = [];
    const params = [];
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (title !== undefined) { setClauses.push('title = ?'); params.push(title.trim()); }
    if (description !== undefined) { setClauses.push('description = ?'); params.push(description || null); }
    if (deadline !== undefined) { setClauses.push('deadline = ?'); params.push(deadline || null); }
    if (attachment_url !== undefined) { setClauses.push('attachment_url = ?'); params.push(attachment_url || null); }

    if (assigned_to_user_id !== undefined) {
      setClauses.push('assigned_to_user_id = ?');
      params.push(assigned_to_user_id || null);
    }

    if (status !== undefined && status !== current.status) {
      setClauses.push('status = ?');
      params.push(status);

      if (status === 'done') {
        setClauses.push('completed_at = ?');
        params.push(now);
      } else if (current.status === 'done') {
        setClauses.push('completed_at = NULL');
      }
    }

    if (setClauses.length === 0) return error(res, 400, 'No fields to update');

    params.push(id);
    await pool.execute(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`, params);

    const [[updated]] = await pool.execute(TASK_SELECT + ' WHERE t.id = ?', [id]);

    // ── Activity logging ─────────────────────────────
    if (status !== undefined && status !== current.status) {
      await logActivity({ taskId: Number(id), userId, action: 'status_changed',
        fieldName: 'status', oldValue: current.status, newValue: status });

      if (status === 'done') {
        await logActivity({ taskId: Number(id), userId, action: 'task_completed' });
      }
    }

    if (assigned_to_user_id !== undefined && assigned_to_user_id !== current.assigned_to_user_id) {
      await logActivity({ taskId: Number(id), userId, action: 'task_assigned',
        fieldName: 'assigned_to', oldValue: current.assignee_name, newValue: updated.assignee_name });
    }

    if (title !== undefined || description !== undefined || deadline !== undefined || attachment_url !== undefined) {
      await logActivity({ taskId: Number(id), userId, action: 'task_updated' });
    }

    return success(res, 200, 'Task updated successfully', enrichTask(updated));
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/tasks/:id ─────────────────────────────────────────
const deleteTask = async (req, res, next) => {
  try {
    const { id: userId, role, division_id: divisionId } = req.user;
    const { id } = req.params;

    const { clause, params: vParams } = buildVisibilityClause(role, userId);
    const [[existing]] = await pool.execute(
      `SELECT id, user_id, assigned_to_user_id FROM tasks WHERE id = ?${clause.replaceAll('t.', '')}`,
      [id, ...vParams]
    );
    if (!existing) return error(res, 404, 'Task not found');

    const canDelete = role === 'admin'
      || existing.user_id === userId
      || existing.assigned_to_user_id === userId;
    if (!canDelete) return error(res, 403, 'You do not have permission to delete this task');

    await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);
    return success(res, 200, 'Task deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/tasks/reorder ──────────────────────────────────────
const reorderTasks = async (req, res, next) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders) || orders.length === 0) {
      return error(res, 400, 'orders array required');
    }
    await Promise.all(
      orders.map(({ id, sort_order }) =>
        pool.execute('UPDATE tasks SET sort_order = ? WHERE id = ?', [sort_order, id])
      )
    );
    return success(res, 200, 'Tasks reordered');
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, reorderTasks };
