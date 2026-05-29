const { body } = require('express-validator');

const createDivisionRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Division name is required')
    .isLength({ min: 2 }).withMessage('Division name must be at least 2 characters'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Description must be a string'),
];

const updateDivisionRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Division name cannot be empty')
    .isLength({ min: 2 }).withMessage('Division name must be at least 2 characters'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Description must be a string'),
];

module.exports = { createDivisionRules, updateDivisionRules };
