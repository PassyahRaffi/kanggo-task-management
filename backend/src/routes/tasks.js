const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { createTaskRules, updateTaskRules } = require('../validators/taskValidator');
const { verifyToken } = require('../middleware/auth');
const commentRoutes  = require('./comments');
const activityRoutes = require('./activities');

router.use(verifyToken);

router.get('/',     getTasks);
router.post('/',    createTaskRules, createTask);
router.put('/:id',  updateTaskRules, updateTask);
router.delete('/:id', deleteTask);

// Nested
router.use('/:id/comments',  commentRoutes);
router.use('/:id/activities', activityRoutes);

module.exports = router;
