// JWT authentication middleware.
// Reads the token from an HTTP-only cookie, verifies it,
// and attaches the decoded user info to req.user.

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const protect = (req, res, next) => {
  try {
    // Read token from cookie (more secure than Authorization header for browser apps)
    const token = req.cookies.token;

    if (!token) {
      // Redirect to login if no token is present
      return res.redirect('/auth/login');
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username }
    next();
  } catch (error) {
    logger.warn(`Invalid JWT token: ${error.message}`);
    res.clearCookie('token');
    res.redirect('/auth/login');
  }
};

// Redirect logged-in users away from login/signup pages
const redirectIfAuthenticated = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect('/tasks');
    } catch {
      // Invalid token — allow through to login page
    }
  }
  next();
};

module.exports = { protect, redirectIfAuthenticated };