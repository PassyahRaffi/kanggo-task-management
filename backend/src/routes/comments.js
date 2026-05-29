const express = require('express');
const router = express.Router({ mergeParams: true });
const { getComments, addComment, updateComment, deleteComment } = require('../controllers/commentController');
const { commentRules } = require('../validators/commentValidator');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/',                         getComments);
router.post('/',    commentRules,        addComment);
router.put('/:commentId',  commentRules, updateComment);
router.delete('/:commentId',             deleteComment);

module.exports = router;
