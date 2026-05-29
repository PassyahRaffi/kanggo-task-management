const { error } = require('../utils/response');

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return error(res, 403, 'You do not have permission to perform this action');
  }
  next();
};

module.exports = { requireRole };
