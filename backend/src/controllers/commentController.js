const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { logActivity } = require('../utils/activityHelper');

const canAccessTask = async (taskId, userId, role) => {
  const [[task]] = await pool.execute(
    'SELECT id, title, user_id, assigned_to_user_id FROM tasks WHERE id = ?',
    [taskId]
  );
  if (!task) return null;
  if (role === 'admin') return task;
  if (task.user_id === userId || task.assigned_to_user_id === userId) return task;
  return null;
};

const getComments = async (req, res, next) => {
  try {
    const { id: taskId } = req.params;
    const { id: userId, role } = req.user;

    const task = await canAccessTask(taskId, userId, role);
    if (!task) return error(res, 404, 'Task not found or access denied');

    const [comments] = await pool.execute(
      `SELECT c.id, c.comment, c.created_at, c.updated_at,
              u.id AS user_id, u.name AS user_name
       FROM task_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
      [taskId]
    );

    return success(res, 200, 'Comments retrieved successfully', comments);
  } catch (err) {
    next(err);
  }
};

const addComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 422, errors.array()[0].msg);
    }

    const { id: taskId } = req.params;
    const { id: userId, role } = req.user;

    const task = await canAccessTask(taskId, userId, role);
    if (!task) return error(res, 404, 'Task not found or access denied');

    const { comment } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO task_comments (task_id, user_id, comment) VALUES (?, ?, ?)',
      [taskId, userId, comment]
    );

    const [[newComment]] = await pool.execute(
      `SELECT c.id, c.comment, c.created_at, c.updated_at, u.id AS user_id, u.name AS user_name
       FROM task_comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
      [result.insertId]
    );

    await logActivity({ taskId: Number(taskId), userId, action: 'comment_added' });

    return success(res, 201, 'Comment added successfully', newComment);
  } catch (err) {
    next(err);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 422, errors.array()[0].msg);
    }

    const { id: taskId, commentId } = req.params;
    const { id: userId, role } = req.user;

    const task = await canAccessTask(taskId, userId, role);
    if (!task) return error(res, 404, 'Task not found or access denied');

    const [[existing]] = await pool.execute(
      'SELECT id, user_id FROM task_comments WHERE id = ? AND task_id = ?',
      [commentId, taskId]
    );
    if (!existing) return error(res, 404, 'Comment not found');
    if (existing.user_id !== userId) return error(res, 403, 'You can only edit your own comments');

    const { comment } = req.body;
    await pool.execute('UPDATE task_comments SET comment = ? WHERE id = ?', [comment, commentId]);

    const [[updated]] = await pool.execute(
      `SELECT c.id, c.comment, c.created_at, c.updated_at, u.id AS user_id, u.name AS user_name
       FROM task_comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
      [commentId]
    );

    return success(res, 200, 'Comment updated successfully', updated);
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { id: taskId, commentId } = req.params;
    const { id: userId, role } = req.user;

    const task = await canAccessTask(taskId, userId, role);
    if (!task) return error(res, 404, 'Task not found or access denied');

    const [[existing]] = await pool.execute(
      'SELECT id, user_id FROM task_comments WHERE id = ? AND task_id = ?',
      [commentId, taskId]
    );
    if (!existing) return error(res, 404, 'Comment not found');

    if (existing.user_id !== userId && role !== 'admin') {
      return error(res, 403, 'You can only delete your own comments');
    }

    await pool.execute('DELETE FROM task_comments WHERE id = ?', [commentId]);
    return success(res, 200, 'Comment deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, addComment, updateComment, deleteComment };
