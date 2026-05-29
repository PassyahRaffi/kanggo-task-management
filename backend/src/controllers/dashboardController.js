const pool = require('../config/db');
const { success } = require('../utils/response');

const getSummary = async (req, res, next) => {
  try {
    const { id: userId, role, division_id: divisionId } = req.user;
    const now = new Date().toISOString().slice(0, 10);

    let data = {};

    if (role === 'super_admin') {
      const [[totals]] = await pool.execute(`
        SELECT
          COUNT(*)                                           AS total,
          SUM(status = 'pending')                           AS pending,
          SUM(status = 'in-progress')                       AS in_progress,
          SUM(status = 'done')                              AS done,
          SUM(status != 'done' AND deadline < ?)            AS overdue
        FROM tasks`, [now]);

      const [[users]]     = await pool.execute('SELECT COUNT(*) AS count FROM users');
      const [[divisions]] = await pool.execute('SELECT COUNT(*) AS count FROM divisions');

      data = { ...totals, total_users: users.count, total_divisions: divisions.count };

    } else if (role === 'admin') {
      const [[divTotals]] = await pool.execute(`
        SELECT
          COUNT(*)                                           AS total,
          SUM(status = 'pending')                           AS pending,
          SUM(status = 'in-progress')                       AS in_progress,
          SUM(status = 'done')                              AS done,
          SUM(status != 'done' AND deadline < ?)            AS overdue
        FROM tasks WHERE division_id = ?`, [now, divisionId]);

      const [[mine]] = await pool.execute(
        `SELECT COUNT(*) AS count FROM tasks WHERE division_id = ? AND assigned_to_user_id = ?`,
        [divisionId, userId]
      );

      data = { ...divTotals, assigned_to_me: mine.count };

    } else {
      // user
      const [[myTotals]] = await pool.execute(`
        SELECT
          COUNT(*)                                           AS total,
          SUM(status = 'pending')                           AS pending,
          SUM(status = 'in-progress')                       AS in_progress,
          SUM(status = 'done')                              AS done,
          SUM(status != 'done' AND deadline < ?)            AS overdue
        FROM tasks
        WHERE user_id = ? OR assigned_to_user_id = ?`, [now, userId, userId]);

      const [[assigned]] = await pool.execute(
        'SELECT COUNT(*) AS count FROM tasks WHERE assigned_to_user_id = ?',
        [userId]
      );
      const [[created]] = await pool.execute(
        'SELECT COUNT(*) AS count FROM tasks WHERE user_id = ?',
        [userId]
      );

      data = { ...myTotals, created_by_me: created.count, assigned_to_me: assigned.count };
    }

    return success(res, 200, 'Dashboard summary retrieved', data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary };
