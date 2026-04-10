// Handles signup, login, and logout.
// Passwords are hashed in the User model. JWT is set as an HTTP-only cookie.

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../config/logger');

// Helper: create a JWT and set it as a cookie
const setTokenCookie = (res, userId, username) => {
  const token = jwt.sign(
    { id: userId, username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,             // Not accessible from JavaScript (prevents XSS)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax',            // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

// GET /auth/login
const showLogin = (req, res) => {
  res.render('auth/login', { title: 'Login', error: null, username: '' });
};

// POST /auth/login
const login = async (req, res, next) => {
  try {
    // Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('auth/login', {
        title: 'Login',
        error: errors.array()[0].msg,
        username: req.body.username,
      });
    }

    const { username, password } = req.body;

    // Find user (case-insensitive username search)
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).render('auth/login', {
        title: 'Login',
        error: 'Invalid username or password',
        username,
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).render('auth/login', {
        title: 'Login',
        error: 'Invalid username or password',
        username,
      });
    }

    // Set JWT cookie and redirect
    setTokenCookie(res, user._id, user.username);
    logger.info(`User logged in: ${user.username}`);
    res.redirect('/tasks');
  } catch (error) {
    next(error);
  }
};

// GET /auth/signup
const showSignup = (req, res) => {
  res.render('auth/signup', { title: 'Sign Up', error: null, username: '' });
};

// POST /auth/signup
const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('auth/signup', {
        title: 'Sign Up',
        error: errors.array()[0].msg,
        username: req.body.username,
      });
    }

    const { username, password } = req.body;

    // Check if username is already taken
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).render('auth/signup', {
        title: 'Sign Up',
        error: 'Username is already taken',
        username,
      });
    }

    // Create user (password hashing happens in the model's pre-save hook)
    const user = await User.create({
      username: username.toLowerCase(),
      password,
    });

    setTokenCookie(res, user._id, user.username);
    logger.info(`New user registered: ${user.username}`);
    res.redirect('/tasks');
  } catch (error) {
    next(error);
  }
};

// POST /auth/logout
const logout = (req, res) => {
  res.clearCookie('token');
  logger.info(`User logged out: ${req.user?.username}`);
  res.redirect('/auth/login');
};

module.exports = { showLogin, login, showSignup, signup, logout };