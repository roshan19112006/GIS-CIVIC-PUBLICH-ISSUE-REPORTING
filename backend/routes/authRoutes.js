const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('phone').optional().trim(),
    validateRequest
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
  ],
  authController.login
);

router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
