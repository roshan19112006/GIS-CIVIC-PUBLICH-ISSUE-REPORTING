const express = require('express');
const { body } = require('express-validator');
const workflowController = require('../controllers/workflowController');
const { authenticateToken, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateRequest } = require('../middleware/validator');

const router = express.Router();

// 1. Assign complaint to officer (Admin only)
router.post(
  '/:id/assign',
  authenticateToken,
  authorize(['admin']),
  [
    body('officer_id').isInt().withMessage('Valid officer ID is required'),
    body('department_id').isInt().withMessage('Valid department ID is required'),
    validateRequest
  ],
  workflowController.assignIssue
);

// 2. Update status (Officer or Admin)
router.put(
  '/:id/status',
  authenticateToken,
  authorize(['admin', 'officer']),
  [
    body('status').isIn(['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened']).withMessage('Valid status is required'),
    validateRequest
  ],
  workflowController.updateStatus
);

// 3. Resolve complaint (with completion image upload) (Officer or Admin)
router.post(
  '/:id/resolution',
  authenticateToken,
  authorize(['admin', 'officer']),
  upload.single('resolution_image'),
  [
    body('resolution_notes').trim().isLength({ min: 10 }).withMessage('Resolution notes must be at least 10 characters long'),
    validateRequest
  ],
  workflowController.resolveIssue
);

// 4. Refer complaint to another department (Officer only)
router.post(
  '/:id/refer',
  authenticateToken,
  authorize(['officer']),
  [
    body('reason').trim().isLength({ min: 5 }).withMessage('Referral reason is required'),
    validateRequest
  ],
  workflowController.referIssue
);

// 5. Citizen rating and feedback / reopen
router.post(
  '/:id/feedback',
  authenticateToken,
  authorize(['citizen', 'admin']),
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    validateRequest
  ],
  workflowController.submitFeedback
);

// 6. Timeline history
router.get('/:id/history', authenticateToken, workflowController.getHistory);

module.exports = router;
