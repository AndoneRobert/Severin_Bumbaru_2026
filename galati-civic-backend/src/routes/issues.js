const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Rute publice (Oricine poate vedea sesizările pe hartă)
router.get('/issues', issueController.listIssues);

// Rute protejate (Doar cetățenii logați pot crea)
router.get('/issues/my', requireAuth, issueController.listMyIssues);
router.post('/issues', requireAuth, issueController.createIssue);
router.put('/issues/:id', requireAuth, issueController.updateIssue);
router.delete('/issues/:id', requireAuth, issueController.deleteIssue);
router.post('/issues/:id/vote', requireAuth, issueController.voteIssue);
router.post('/issues/:id/flag', requireAuth, issueController.flagIssue);
router.post('/issues/:id/reply', requireAuth, requireRole(['moderator', 'admin']), issueController.replyIssue);

// Rute administrative (Doar moderatorii sau adminii pot schimba statusul)
router.patch('/issues/:id/status', requireAuth, requireRole(['moderator', 'admin']), issueController.updateIssue);

module.exports = router;
