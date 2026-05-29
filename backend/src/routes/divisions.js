const express = require('express');
const router = express.Router();
const { getDivisions, createDivision, updateDivision, deleteDivision } = require('../controllers/divisionController');
const { createDivisionRules, updateDivisionRules } = require('../validators/divisionValidator');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(verifyToken);

router.get('/', getDivisions);

router.post('/',     requireRole('super_admin'), createDivisionRules, createDivision);
router.put('/:id',   requireRole('super_admin'), updateDivisionRules, updateDivision);
router.delete('/:id',requireRole('super_admin'), deleteDivision);

module.exports = router;
