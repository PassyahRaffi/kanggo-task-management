const express = require('express');
const router  = express.Router();
const { getUsers, getMe, updateMe, updatePassword } = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
router.get('/',              getUsers);
router.get('/me',            getMe);
router.put('/me',            updateMe);
router.put('/me/password',   updatePassword);

module.exports = router;
