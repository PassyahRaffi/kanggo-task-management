const express = require('express');
const router = express.Router({ mergeParams: true });
const { getActivities } = require('../controllers/activityController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.get('/', getActivities);

module.exports = router;
