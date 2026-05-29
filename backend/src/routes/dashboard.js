const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.get('/summary', getSummary);

module.exports = router;
