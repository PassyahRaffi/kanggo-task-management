const pool = require('../config/db');

const getAccessibleTask = async (taskId, { userId, role }) => {
  const [[task]] = await pool.execute(
    `SELECT t.*, u.name AS creator_name, au.name AS assignee_name
     FROM tasks t
     LEFT JOIN users u  ON u.id  = t.user_id
     LEFT JOIN users au ON au.id = t.assigned_to_user_id
     WHERE t.id = ?`,
    [taskId]
  );
  if (!task) return null;

  if (role === 'admin') return task;
  return (task.user_id === userId || task.assigned_to_user_id === userId) ? task : null;
};

module.exports = { getAccessibleTask };
