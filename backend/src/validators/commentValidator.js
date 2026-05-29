const { body } = require('express-validator');

const commentRules = [
  body('comment')
    .trim()
    .notEmpty().withMessage('Comment cannot be empty'),
];

module.exports = { commentRules };
