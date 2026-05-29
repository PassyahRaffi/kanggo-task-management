const pool = require('../config/db');

const createNotification = async ({ userId, taskId = null, type, title, message }) => {
  try {
    await pool.execute(
      'INSERT INTO notifications (user_id, task_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
      [userId, taskId, type, title, message]
    );
  } catch (err) {
    console.error('[Notification Error]', err.message);
  }
};

/**
 * Notify all users related to a task (creator + assignee) except the actor.
 */
const notifyRelated = async ({ task, actorId, type, title, message }) => {
  const recipients = new Set();
  if (task.user_id && task.user_id !== actorId)             recipients.add(task.user_id);
  if (task.assigned_to_user_id && task.assigned_to_user_id !== actorId) recipients.add(task.assigned_to_user_id);
  for (const userId of recipients) {
    await createNotification({ userId, taskId: task.id, type, title, message });
  }
};

module.exports = { createNotification, notifyRelated };
