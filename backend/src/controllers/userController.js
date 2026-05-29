const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { success, error } = require('../utils/response');

const getUsers = async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      "SELECT id, name, email, role FROM users WHERE role = 'user' ORDER BY name ASC"
    );
    return success(res, 200, 'Users retrieved successfully', users);
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const [[user]] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]
    );
    if (!user) return error(res, 404, 'User not found');
    return success(res, 200, 'Profile retrieved', user);
  } catch (err) { next(err); }
};

const updateMe = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name?.trim()) return error(res, 422, 'Name is required');
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return error(res, 422, 'Valid email is required');

    const [dup] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]
    );
    if (dup.length > 0) return error(res, 409, 'Email already in use');

    await pool.execute(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name.trim(), email.trim(), req.user.id]
    );
    const [[updated]] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]
    );
    return success(res, 200, 'Profile updated successfully', updated);
  } catch (err) { next(err); }
};

const updatePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!new_password)
      return error(res, 422, 'New password is required');

    const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!PASSWORD_RE.test(new_password))
      return error(res, 422, 'Password must be at least 8 characters with uppercase, lowercase, number, and special character');

    if (current_password) {
      const [[user]] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
      const match = await bcrypt.compare(current_password, user.password);
      if (!match) return error(res, 401, 'Current password is incorrect');
    }

    const hashed = await bcrypt.hash(new_password, 12);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    return success(res, 200, 'Password updated successfully');
  } catch (err) { next(err); }
};

module.exports = { getUsers, getMe, updateMe, updatePassword };
