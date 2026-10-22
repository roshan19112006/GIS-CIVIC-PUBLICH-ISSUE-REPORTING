const express = require('express');
const { body } = require('express-validator');
const issueController = require('../controllers/issueController');
const { authenticateToken, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateRequest } = require('../middleware/validator');

const router = express.Router();

// Get list of issues (authenticated)
router.get('/', authenticateToken, issueController.getIssues);

// Get single issue
router.get('/:id', authenticateToken, issueController.getIssueById);

// Create new civic issue (with image upload)
router.post(
  '/',
  authenticateToken,
  upload.single('image'),
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title too long'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category_id').isInt().withMessage('Valid category is required'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    validateRequest
  ],
  issueController.createIssue
);

// Update issue
router.put('/:id', authenticateToken, issueController.updateIssue);

// Delete issue (Admin only)
router.delete('/:id', authenticateToken, authorize(['admin']), issueController.deleteIssue);

module.exports = router;
