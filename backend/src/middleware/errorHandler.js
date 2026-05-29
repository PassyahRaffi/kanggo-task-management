const { error } = require('../utils/response');

const notFound = (req, res) => {
  error(res, 404, `Route ${req.originalUrl} not found`);
};

const globalError = (err, req, res, next) => {
  console.error('[Error]', err.message);

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message || 'An unexpected error occurred';

  error(res, statusCode, message);
};

module.exports = { notFound, globalError };
