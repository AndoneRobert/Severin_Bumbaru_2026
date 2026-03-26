const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Rute publice pentru sesizări
router.get('/issues', issueController.listIssues);

// Rute protejate pentru utilizatori autentificați
router.get('/issues/my', requireAuth, issueController.listMyIssues);
router.post('/issues', requireAuth, issueController.createIssue);
router.put('/issues/:id', requireAuth, issueController.updateIssue);
router.delete('/issues/:id', requireAuth, issueController.deleteIssue);
router.post('/issues/:id/vote', requireAuth, issueController.voteIssue);
router.get('/issues/follows/my', requireAuth, issueController.listMyFollowedIssues);
router.post('/issues/:id/follow', requireAuth, issueController.followIssue);
router.delete('/issues/:id/follow', requireAuth, issueController.unfollowIssue);
router.post('/issues/:id/flag', requireAuth, issueController.flagIssue);
router.post('/issues/:id/reply', requireAuth, requireRole(['moderator', 'admin']), issueController.replyIssue);

// Rută administrativă dedicată schimbării statusului
router.patch('/issues/:id/status', requireAuth, requireRole(['moderator', 'admin']), issueController.updateIssueStatus);

module.exports = router;
