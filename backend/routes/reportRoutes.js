const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// CSV Export - Admin or Officer
router.get('/issues.csv', authenticateToken, authorize(['admin', 'officer']), reportController.exportIssuesCsv);

module.exports = router;
