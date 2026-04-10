const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { showLogin, login, showSignup, signup, logout } = require('../controllers/authController');
const { redirectIfAuthenticated, protect } = require('../middleware/auth');

// Validation rules reused across routes
const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const signupValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3–30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
];

router.get('/login', redirectIfAuthenticated, showLogin);
router.post('/login', redirectIfAuthenticated, loginValidation, login);

router.get('/signup', redirectIfAuthenticated, showSignup);
router.post('/signup', redirectIfAuthenticated, signupValidation, signup);

router.post('/logout', protect, logout);

module.exports = router;