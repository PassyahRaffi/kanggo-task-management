const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { success, error } = require('../utils/response');

const getDivisions = async (req, res, next) => {
  try {
    const [divisions] = await pool.execute(`
      SELECT
        d.id, d.name, d.description, d.created_at, d.updated_at,
        COUNT(DISTINCT u.id) AS user_count,
        COUNT(DISTINCT t.id) AS task_count
      FROM divisions d
      LEFT JOIN users u ON u.division_id = d.id
      LEFT JOIN tasks t ON t.division_id = d.id
      GROUP BY d.id
      ORDER BY d.name ASC
    `);
    return success(res, 200, 'Divisions retrieved successfully', divisions);
  } catch (err) {
    next(err);
  }
};

const createDivision = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0].msg;
      return error(res, 422, firstError, errors.array().map((e) => ({ field: e.path, message: e.msg })));
    }

    const { name, description } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM divisions WHERE name = ?',
      [name.trim()]
    );
    if (existing.length > 0) {
      return error(res, 409, 'Division name already exists');
    }

    const [result] = await pool.execute(
      'INSERT INTO divisions (name, description) VALUES (?, ?)',
      [name.trim(), description || null]
    );

    const [rows] = await pool.execute('SELECT * FROM divisions WHERE id = ?', [result.insertId]);
    return success(res, 201, 'Division created successfully', rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateDivision = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0].msg;
      return error(res, 422, firstError, errors.array().map((e) => ({ field: e.path, message: e.msg })));
    }

    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id FROM divisions WHERE id = ?', [id]);
    if (existing.length === 0) {
      return error(res, 404, 'Division not found');
    }

    const { name, description } = req.body;

    if (name) {
      const [nameTaken] = await pool.execute(
        'SELECT id FROM divisions WHERE name = ? AND id != ?',
        [name.trim(), id]
      );
      if (nameTaken.length > 0) {
        return error(res, 409, 'Division name already exists');
      }
    }

    const setClauses = [];
    const params = [];

    if (name !== undefined) { setClauses.push('name = ?'); params.push(name.trim()); }
    if (description !== undefined) { setClauses.push('description = ?'); params.push(description || null); }

    if (setClauses.length === 0) {
      return error(res, 400, 'No fields to update');
    }

    params.push(id);
    await pool.execute(`UPDATE divisions SET ${setClauses.join(', ')} WHERE id = ?`, params);

    const [rows] = await pool.execute('SELECT * FROM divisions WHERE id = ?', [id]);
    return success(res, 200, 'Division updated successfully', rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteDivision = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT id FROM divisions WHERE id = ?', [id]);
    if (existing.length === 0) {
      return error(res, 404, 'Division not found');
    }

    const [[userCount]] = await pool.execute(
      'SELECT COUNT(*) AS count FROM users WHERE division_id = ?',
      [id]
    );
    if (userCount.count > 0) {
      return error(res, 409, 'Division cannot be deleted because it still has users.');
    }

    const [[taskCount]] = await pool.execute(
      'SELECT COUNT(*) AS count FROM tasks WHERE division_id = ?',
      [id]
    );
    if (taskCount.count > 0) {
      return error(res, 409, 'Division cannot be deleted because it still has tickets.');
    }

    await pool.execute('DELETE FROM divisions WHERE id = ?', [id]);
    return success(res, 200, 'Division deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDivisions, createDivision, updateDivision, deleteDivision };
