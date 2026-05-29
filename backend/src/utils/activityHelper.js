const pool = require('../config/db');

const logActivity = async ({ taskId, userId, action, fieldName = null, oldValue = null, newValue = null }) => {
  try {
    await pool.execute(
      'INSERT INTO task_activities (task_id, user_id, action, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
      [taskId, userId, action, fieldName, oldValue != null ? String(oldValue) : null, newValue != null ? String(newValue) : null]
    );
  } catch (err) {
    console.error('[ActivityLog Error]', err.message);
  }
};

module.exports = { logActivity };
