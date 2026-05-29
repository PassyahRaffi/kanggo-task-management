const pool = require('../config/db');

/**
 * Returns the task row if the user can access it, null otherwise.
 * Access rules:
 *   super_admin  → any task
 *   admin        → tasks in their division
 *   user         → tasks they created OR are assigned to
 */
const getAccessibleTask = async (taskId, { userId, role, divisionId }) => {
  const [[task]] = await pool.execute(
    `SELECT t.*, u.name AS creator_name, au.name AS assignee_name, d.name AS division_name
     FROM tasks t
     LEFT JOIN users u  ON u.id  = t.user_id
     LEFT JOIN users au ON au.id = t.assigned_to_user_id
     LEFT JOIN divisions d ON d.id = t.division_id
     WHERE t.id = ?`,
    [taskId]
  );
  if (!task) return null;

  if (role === 'super_admin') return task;
  if (role === 'admin') return task.division_id === divisionId ? task : null;
  // user
  return (task.user_id === userId || task.assigned_to_user_id === userId) ? task : null;
};

module.exports = { getAccessibleTask };
