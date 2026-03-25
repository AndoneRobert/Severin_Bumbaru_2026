const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Rute publice (Oricine poate vedea sesizările pe hartă)
router.get('/', issueController.getIssues);

// Rute protejate (Doar cetățenii logați pot crea)
router.post('/', requireAuth, issueController.createIssue);

// Rute administrative (Doar moderatorii sau adminii pot schimba statusul)
router.patch('/:id/status', requireAuth, requireRole(['moderator', 'admin']), issueController.updateIssueStatus);

module.exports = router;