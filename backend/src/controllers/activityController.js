const pool = require('../config/db');
const { success, error } = require('../utils/response');

const getActivities = async (req, res, next) => {
  try {
    const { id: taskId } = req.params;
    const { id: userId, role } = req.user;

    const [[task]] = await pool.execute(
      'SELECT id, user_id, assigned_to_user_id FROM tasks WHERE id = ?',
      [taskId]
    );
    if (!task) return error(res, 404, 'Task not found');
    if (role !== 'admin' && task.user_id !== userId && task.assigned_to_user_id !== userId) {
      return error(res, 403, 'Access denied');
    }

    const [activities] = await pool.execute(
      `SELECT a.id, a.action, a.field_name, a.old_value, a.new_value, a.created_at,
              u.name AS actor_name
       FROM task_activities a
       JOIN users u ON u.id = a.user_id
       WHERE a.task_id = ?
       ORDER BY a.created_at ASC`,
      [taskId]
    );

    return success(res, 200, 'Activities retrieved successfully', activities);
  } catch (err) {
    next(err);
  }
};

module.exports = { getActivities };
