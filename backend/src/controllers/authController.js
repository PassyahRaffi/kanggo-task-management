const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { success, error } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0].msg;
      return error(res, 422, firstError, errors.array().map((e) => ({ field: e.path, message: e.msg })));
    }

    const { name, email, password } = req.body;
    const displayName = name?.trim() || email.split('@')[0];

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return error(res, 409, 'Email is already registered');

    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [displayName, email, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.insertId, email, role: 'user', division_id: null },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return success(res, 201, 'Registration successful', {
      token,
      user: { id: result.insertId, name: displayName, email, role: 'user', division_id: null },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0].msg;
      return error(res, 422, firstError, errors.array().map((e) => ({ field: e.path, message: e.msg })));
    }

    const { email, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT id, name, email, password, role, division_id FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0) return error(res, 401, 'Invalid email or password');

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return error(res, 401, 'Invalid email or password');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, division_id: user.division_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return success(res, 200, 'Login successful', {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, division_id: user.division_id },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
