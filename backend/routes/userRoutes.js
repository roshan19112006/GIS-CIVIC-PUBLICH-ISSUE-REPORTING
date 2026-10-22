const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

const router = express.Router();

// Public meta routes for forms
router.get('/meta/departments', userController.getDepartments);
router.get('/meta/wards', userController.getWards);
router.get('/meta/categories', userController.getCategories);

// User CRUD - Protected
router.get('/', authenticateToken, authorize(['admin', 'officer']), userController.getUsers);

router.post(
  '/',
  authenticateToken,
  authorize(['admin']),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('role').isIn(['admin', 'officer', 'citizen']).withMessage('Role must be admin, officer, or citizen'),
    validateRequest
  ],
  userController.createUser
);

router.put('/:id', authenticateToken, userController.updateUser);
router.delete('/:id', authenticateToken, authorize(['admin']), userController.deleteUser);

module.exports = router;
