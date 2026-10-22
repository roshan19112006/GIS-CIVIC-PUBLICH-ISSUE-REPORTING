const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Allow public to fetch overview stats for landing page if no token, or personalized if authenticated
router.get('/stats', (req, res, next) => {
  // If authorization header is present, authenticate it, otherwise proceed anonymously
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req, res, next);
  }
  req.user = null;
  next();
}, dashboardController.getStats);

router.get('/analytics', authenticateToken, dashboardController.getAnalytics);

module.exports = router;
