const pool = require('../config/db');
const { success, error } = require('../utils/response');

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [notifications] = await pool.execute(
      `SELECT n.id, n.type, n.title, n.message, n.is_read, n.created_at,
              t.title AS task_title
       FROM notifications n
       LEFT JOIN tasks t ON t.id = n.task_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    return success(res, 200, 'Notifications retrieved successfully', notifications);
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const [[{ count }]] = await pool.execute(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );
    return success(res, 200, 'Unread count retrieved', { count });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [[notif]] = await pool.execute(
      'SELECT id, user_id FROM notifications WHERE id = ?',
      [id]
    );
    if (!notif) return error(res, 404, 'Notification not found');
    if (notif.user_id !== userId) return error(res, 403, 'Access denied');

    await pool.execute('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    return success(res, 200, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );
    return success(res, 200, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead };
