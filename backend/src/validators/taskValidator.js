const { body } = require('express-validator');

const VALID_STATUSES = ['pending', 'in-progress', 'done'];

const createTaskRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage('Invalid task status. Must be: pending, in-progress, or done'),
  body('deadline')
    .optional({ nullable: true, checkFalsy: true })
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('Invalid deadline format. Use YYYY-MM-DD'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Description must be a string'),
  body('assigned_to_user_id')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Invalid user ID for assignment'),
  body('attachment_url')
    .optional({ nullable: true, checkFalsy: true })
    .isURL().withMessage('Only valid URLs are allowed.'),
];

const updateTaskRules = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Task title cannot be empty'),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage('Invalid task status. Must be: pending, in-progress, or done'),
  body('deadline')
    .optional({ nullable: true, checkFalsy: true })
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('Invalid deadline format. Use YYYY-MM-DD'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Description must be a string'),
  body('assigned_to_user_id')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Invalid user ID for assignment'),
  body('attachment_url')
    .optional({ nullable: true, checkFalsy: true })
    .isURL().withMessage('Only valid URLs are allowed.'),
];

module.exports = { createTaskRules, updateTaskRules };
